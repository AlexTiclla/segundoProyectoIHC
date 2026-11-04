import { test, expect } from '@playwright/test';

import { agregarMascota, entrarConCuentaNueva, tarjeta, textoUnico } from './ayudantes';

test('Ana ve en el historial lo que hizo, con lo último primero', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  await tarjeta(page, nombre).getByRole('button', { name: 'Marcar como realizado' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Marcar como realizado' }).click();
  await expect(tarjeta(page, nombre).getByText('Realizado', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Historial' }).click();
  await expect(page.getByRole('heading', { name: 'Historial de acciones' })).toBeVisible();

  const registros = page.getByRole('listitem');
  await expect(registros).toHaveCount(2);
  await expect(registros.nth(0)).toContainText('Cuidado realizado');
  await expect(registros.nth(0)).toContainText(nombre);
  await expect(registros.nth(1)).toContainText('Creación');
});

test('Una cuenta nueva ve el historial vacío', async ({ page }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);

  await page.getByRole('link', { name: 'Historial' }).click();

  await expect(page.getByText('Todavía no hay acciones registradas.')).toBeVisible();
});
