import { test, expect } from '@playwright/test';

import { agregarMascota, entrarConCuentaNueva, textoUnico } from './ayudantes';

// Flujo principal de Mascota al Día: Semilla -> Login -> Crear -> Lo ve en pantalla.

test('Ana registra una mascota y la ve en su lista', async ({ page }, testInfo) => {
  const nombreMascota = `Firulais${textoUnico(testInfo)}`;

  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombreMascota, 'Vacuna');

  // Lo ve en pantalla: mensaje de éxito y la mascota sigue en la lista al recargar
  await expect(page.getByText('Mascota creada con éxito')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: nombreMascota })).toBeVisible();
});

test('Ana ve qué corregir si envía el formulario vacío', async ({ page }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);

  // Vacío: la pantalla explica qué hacer para empezar
  await expect(page.getByText('Aún no tienes mascotas.')).toBeVisible();

  await page.getByRole('button', { name: 'Agregar mascota' }).click();
  await page.getByRole('button', { name: 'Crear mascota' }).click();

  await expect(page.getByText('Escribe el nombre de tu mascota')).toBeVisible();
  await expect(page.getByText('Elige o escribe la especie de tu mascota')).toBeVisible();
  await expect(page.getByText('Elige o escribe el cuidado de tu mascota')).toBeVisible();
  await expect(page.getByText('Elige la fecha del cuidado')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Nueva mascota' })).toBeVisible();
});

test('Ana no puede crear un cuidado con fecha pasada', async ({ page }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);

  await page.getByRole('button', { name: 'Agregar mascota' }).click();
  await page.getByLabel('Nombre').fill(`Pasado${textoUnico(testInfo)}`);
  await page.getByLabel('Especie').selectOption('Perro');
  await page.getByLabel('Cuidado', { exact: true }).selectOption('Vacuna');
  await page.getByLabel('Fecha del cuidado').fill('2020-01-15');
  await page.getByRole('button', { name: 'Crear mascota' }).click();

  await expect(page.getByText('La fecha no puede ser anterior a hoy')).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByText('Aún no tienes mascotas.')).toBeVisible();
});

test('Ana filtra por tipo de cuidado y limpia los filtros', async ({ page }, testInfo) => {
  const sufijo = textoUnico(testInfo);
  const conVacuna = `Luna${sufijo}`;
  const conBano = `Rocky${sufijo}`;

  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, conVacuna, 'Vacuna');
  await agregarMascota(page, conBano, 'Baño');
  await expect(page.getByRole('status').filter({ hasText: '2 cuidados' })).toBeVisible();

  // En celular el panel de filtros está cerrado; en esta pantalla ya se ve
  await page.getByRole('group', { name: 'Tipo de cuidado' }).getByRole('button', { name: 'Vacuna' }).click();

  await expect(page.getByRole('status').filter({ hasText: '1 cuidado' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quitar filtro Cuidado: Vacuna' })).toBeVisible();
  await expect(page.getByRole('heading', { name: conVacuna })).toBeVisible();
  await expect(page.getByRole('heading', { name: conBano })).toBeHidden();

  await page.getByRole('button', { name: 'Limpiar todo' }).click();

  await expect(page.getByRole('status').filter({ hasText: '2 cuidados' })).toBeVisible();
  await expect(page.getByRole('heading', { name: conBano })).toBeVisible();
});

test('Ana usa un filtro sin resultados y ve el aviso', async ({ page }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, `Luna${textoUnico(testInfo)}`);

  await page.getByRole('group', { name: 'Tipo de cuidado' }).getByRole('button', { name: 'Baño' }).click();

  await expect(page.getByText('Ningún cuidado coincide con los filtros.')).toBeVisible();
});
