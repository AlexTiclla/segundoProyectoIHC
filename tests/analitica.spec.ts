import { test, expect } from '@playwright/test';

import { agregarMascota, entrarConCuentaNueva, tarjeta, textoUnico } from './ayudantes';

async function leerResumen(page: import('@playwright/test').Page) {
  const respuesta = await page.request.get('/api/analitica/resumen');
  expect(respuesta.status()).toBe(200);
  return respuesta.json() as Promise<{ iniciados: number; completados: number; porcentaje: number }>;
}

test('crear un cuidado registra cuidado_abierto y sube en el panel', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);

  const antes = await leerResumen(page);
  await agregarMascota(page, nombre);
  const despues = await leerResumen(page);

  expect(despues.iniciados).toBeGreaterThan(antes.iniciados);

  await page.goto('/analitica');
  await expect(page.getByRole('heading', { name: 'Analítica de cuidados' })).toBeVisible();
  await expect(page.getByText(String(despues.iniciados))).toBeVisible();
});

test('marcar un cuidado como realizado registra cuidado_completado y sube en el panel', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  const antes = await leerResumen(page);
  await tarjeta(page, nombre).getByRole('button', { name: 'Marcar como realizado' }).click();
  await page.getByRole('button', { name: 'Marcar como realizado' }).last().click();
  await expect(page.getByText(`se marcó como realizado`)).toBeVisible();
  const despues = await leerResumen(page);

  expect(despues.completados).toBeGreaterThan(antes.completados);

  await page.goto('/analitica');
  await expect(page.getByRole('heading', { name: 'Analítica de cuidados' })).toBeVisible();
  await expect(page.getByText(String(despues.completados))).toBeVisible();
});
