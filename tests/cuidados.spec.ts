import { test, expect } from '@playwright/test';

import {
  abrirMenu,
  agregarMascota,
  crearCuenta,
  entrarConCuentaNueva,
  fechaConDias,
  fechaEnPantalla,
  tarjeta,
  textoUnico,
} from './ayudantes';

test('Ana edita los datos de un cuidado', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  const nuevoNombre = `Perla${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  await abrirMenu(page, nombre, 'Editar');
  await page.getByLabel('Nombre').fill(nuevoNombre);
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(page.getByText('Mascota actualizada con éxito')).toBeVisible();
  await expect(page.getByRole('heading', { name: nuevoNombre })).toBeVisible();
  await expect(page.getByRole('heading', { name: nombre })).toBeHidden();
});

test('Ana no puede dejar el nombre vacío al editar', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  await abrirMenu(page, nombre, 'Editar');
  await page.getByLabel('Nombre').fill('');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(page.getByText('Escribe el nombre de tu mascota')).toBeVisible();
});

test('Ana reprograma un cuidado', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  const nuevaFecha = fechaConDias(10);
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  await tarjeta(page, nombre).getByRole('button', { name: 'Reprogramar' }).click();
  await page.getByLabel('Nueva fecha').fill(nuevaFecha);
  await page.getByRole('button', { name: 'Guardar fecha' }).click();

  await expect(page.getByText(`El cuidado de ${nombre} se reprogramó con éxito`)).toBeVisible();
  await expect(tarjeta(page, nombre).getByText(fechaEnPantalla(nuevaFecha))).toBeVisible();
  await expect(tarjeta(page, nombre).getByText('Pendiente · en 10 días')).toBeVisible();
});

test('Ana no puede reprogramar a una fecha pasada', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  await tarjeta(page, nombre).getByRole('button', { name: 'Reprogramar' }).click();
  await page.getByLabel('Nueva fecha').fill('2020-01-15');
  await page.getByRole('button', { name: 'Guardar fecha' }).click();

  await expect(page.getByText('La fecha no puede ser anterior a hoy')).toBeVisible();
});

test('Ana asigna a otra persona como responsable', async ({ page, browser }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;

  // La otra cuenta se crea en un contexto aparte para no mezclar las sesiones
  const contextoOtro = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
  const paginaOtro = await contextoOtro.newPage();
  const otro = await crearCuenta(paginaOtro, testInfo, 'Juan Responsable');
  await contextoOtro.close();

  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  await abrirMenu(page, nombre, 'Asignar responsable');
  await page.getByLabel('Correo del responsable').fill(otro.correo);
  await page.getByRole('button', { name: 'Asignar', exact: true }).click();

  await expect(page.getByText(`Responsable asignado al cuidado de ${nombre}`)).toBeVisible();
  await expect(tarjeta(page, nombre).getByText('Responsable: Juan Responsable')).toBeVisible();
});

test('Ana ve un error si el responsable no tiene cuenta', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  await abrirMenu(page, nombre, 'Asignar responsable');
  await page.getByLabel('Correo del responsable').fill(`nadie${textoUnico(testInfo)}@correo.com`);
  await page.getByRole('button', { name: 'Asignar', exact: true }).click();

  await expect(page.getByText('No existe una cuenta con ese correo')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('Ana marca un cuidado como realizado y sigue así al recargar', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  await tarjeta(page, nombre).getByRole('button', { name: 'Marcar como realizado' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Marcar como realizado' }).click();

  await expect(page.getByText(`El cuidado de ${nombre} se marcó como realizado`)).toBeVisible();
  await expect(tarjeta(page, nombre).getByText('Realizado', { exact: true })).toBeVisible();

  await page.reload();
  await expect(tarjeta(page, nombre).getByText('Realizado', { exact: true })).toBeVisible();

  // Ya no se ofrece reprogramarlo ni marcarlo otra vez
  await expect(tarjeta(page, nombre).getByRole('button', { name: 'Reprogramar' })).toBeHidden();
  await expect(tarjeta(page, nombre).getByRole('button', { name: 'Marcar como realizado' })).toBeHidden();
});

test('Ana cancela al marcar como realizado y el cuidado sigue pendiente', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  await tarjeta(page, nombre).getByRole('button', { name: 'Marcar como realizado' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();

  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(tarjeta(page, nombre).getByText('Pendiente · hoy')).toBeVisible();
});

test('Ana elimina un cuidado y no vuelve al recargar', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  await abrirMenu(page, nombre, 'Eliminar');
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();

  await expect(page.getByText(`El cuidado de ${nombre} se eliminó con éxito`)).toBeVisible();
  await expect(page.getByRole('heading', { name: nombre })).toBeHidden();

  await page.reload();
  await expect(page.getByText('Aún no tienes mascotas.')).toBeVisible();
});

test('Ana cancela al eliminar y el cuidado sigue en la lista', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  await abrirMenu(page, nombre, 'Eliminar');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();

  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('heading', { name: nombre })).toBeVisible();
});
