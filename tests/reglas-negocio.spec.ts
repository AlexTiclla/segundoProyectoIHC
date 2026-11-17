import { type APIResponse } from '@playwright/test';
import { test, expect } from './base';

import { abrirComo, compartirCon, crearCuidadoPorApi, entrarConCuentaNueva, fechaConDias } from './ayudantes';

// Reglas de negocio del backend que la interfaz no deja provocar (el formulario lo evita
// antes de enviar), pero que la API igual debe hacer cumplir: se prueban llamándola directo.

async function esperarError(respuesta: APIResponse, estado: number, mensaje: string) {
  expect(respuesta.status()).toBe(estado);
  expect((await respuesta.json()).detail).toBe(mensaje);
}

test.describe('Accesos compartidos', () => {
  test('no se puede invitar a un correo sin cuenta', async ({ page }, testInfo) => {
    await entrarConCuentaNueva(page, testInfo);
    const respuesta = await page.request.post('/api/accesos', {
      data: { correo: 'nadie-con-esta-cuenta@correo.com', permiso: 'consulta' },
    });
    await esperarError(respuesta, 404, 'No existe una cuenta con ese correo');
  });

  test('solo el invitado responde la invitación, y una sola vez', async ({ page, browser }, testInfo) => {
    await entrarConCuentaNueva(page, testInfo);
    const juan = await abrirComo(browser, testInfo, 'Juan Gestor');
    const invitacion = await page.request.post('/api/accesos', {
      data: { correo: juan.cuenta.correo, permiso: 'gestion' },
    });
    const { id } = await invitacion.json();

    // Ana no puede aceptar por Juan: para ella esa invitación no existe
    await esperarError(await page.request.patch(`/api/accesos/${id}/aceptar`), 404, 'No se encontró la invitación');

    expect((await juan.page.request.patch(`/api/accesos/${id}/aceptar`)).status()).toBe(200);
    await esperarError(
      await juan.page.request.patch(`/api/accesos/${id}/rechazar`),
      400,
      'Esta invitación ya fue respondida',
    );
  });

  test('un acceso revocado no se puede revocar de nuevo', async ({ page, browser }, testInfo) => {
    await entrarConCuentaNueva(page, testInfo);
    const eva = await abrirComo(browser, testInfo, 'Eva Lectora');
    const id = await compartirCon(page, eva, 'consulta');

    expect((await page.request.patch(`/api/accesos/${id}/revocar`)).status()).toBe(200);
    await esperarError(await page.request.patch(`/api/accesos/${id}/revocar`), 400, 'Este acceso ya no está vigente');
  });
});

test.describe('Cuidados', () => {
  test('un cuidado que no existe, o de otra persona sin acceso, responde 404', async ({ page, browser }, testInfo) => {
    await entrarConCuentaNueva(page, testInfo);
    const id = await crearCuidadoPorApi(page, { nombre: 'Luna' });
    const extrano = await abrirComo(browser, testInfo, 'Persona Extraña');

    await esperarError(await page.request.get('/api/mascotas/999999999'), 404, 'No se encontró la mascota');
    // Sin acceso es 404 y no 403, para no revelar que el cuidado existe
    await esperarError(await extrano.page.request.get(`/api/mascotas/${id}`), 404, 'No se encontró la mascota');
  });

  test('la repetición necesita cantidad y unidad, y una cantidad válida', async ({ page }, testInfo) => {
    await entrarConCuentaNueva(page, testInfo);
    const base = { nombre: 'Rocky', sexo: 'Macho', especie: 'Perro', cuidado: 'Baño', fecha_cuidado: fechaConDias(0) };

    await esperarError(
      await page.request.post('/api/mascotas', { data: { ...base, intervalo_cantidad: 7 } }),
      400,
      'Indica cada cuánto se repite el cuidado',
    );
    await esperarError(
      await page.request.post('/api/mascotas', { data: { ...base, intervalo_cantidad: 0, intervalo_unidad: 'dias' } }),
      400,
      'La repetición debe ser de 1 a 365',
    );
  });

  test('no se crea un cuidado con fecha pasada', async ({ page }, testInfo) => {
    await entrarConCuentaNueva(page, testInfo);
    const respuesta = await page.request.post('/api/mascotas', {
      data: { nombre: 'Luna', sexo: 'Hembra', especie: 'Gato', cuidado: 'Vacuna', fecha_cuidado: fechaConDias(-1) },
    });
    await esperarError(respuesta, 400, 'La fecha del cuidado no puede ser anterior a hoy');
  });

  test('un cuidado realizado no se vuelve a realizar ni cambia de responsable', async ({ page }, testInfo) => {
    const cuenta = await entrarConCuentaNueva(page, testInfo);
    const id = await crearCuidadoPorApi(page, { nombre: 'Luna' });
    expect((await page.request.patch(`/api/mascotas/${id}/realizar`)).status()).toBe(200);

    await esperarError(
      await page.request.patch(`/api/mascotas/${id}/realizar`),
      400,
      'Este cuidado ya está finalizado y no puede marcarse como realizado',
    );
    await esperarError(
      await page.request.patch(`/api/mascotas/${id}/responsable`, { data: { correo: cuenta.correo } }),
      400,
      'El cuidado ya fue realizado',
    );
  });

  test('reprogramar exige otra fecha, un motivo y, para mover las siguientes, que se repita', async ({
    page,
  }, testInfo) => {
    await entrarConCuentaNueva(page, testInfo);
    const id = await crearCuidadoPorApi(page, { nombre: 'Luna' });
    const reprogramar = (datos: object) =>
      page.request.patch(`/api/mascotas/${id}/reprogramar`, {
        data: { fecha_cuidado: fechaConDias(3), motivo: 'Viaje', ...datos },
      });

    await esperarError(await reprogramar({ fecha_cuidado: fechaConDias(0) }), 400, 'Elige una fecha distinta a la actual');
    await esperarError(await reprogramar({ motivo: '   ' }), 400, 'Escribe el motivo del cambio');
    await esperarError(
      await reprogramar({ alcance: 'futuras' }),
      400,
      'Este cuidado no se repite, por eso no tiene fechas siguientes',
    );
  });

  test('solo se omite un cuidado vencido', async ({ page }, testInfo) => {
    await entrarConCuentaNueva(page, testInfo);
    const id = await crearCuidadoPorApi(page, { nombre: 'Luna' });
    await esperarError(
      await page.request.patch(`/api/mascotas/${id}/omitir`, { data: { motivo: 'No hizo falta' } }),
      400,
      'Solo se pueden omitir cuidados vencidos',
    );
  });
});
