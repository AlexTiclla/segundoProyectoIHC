import { test, expect, type Page } from '@playwright/test';

import { agregarMascota, entrarConCuentaNueva, tarjeta, textoUnico } from './ayudantes';

async function leerResumen(page: Page) {
  const respuesta = await page.request.get('/api/analitica/resumen');
  expect(respuesta.status()).toBe(200);
  return respuesta.json() as Promise<{ iniciados: number; completados: number; porcentaje: number }>;
}

// El número del panel, leído del DOM (no de una variable capturada antes), porque
// /analitica/resumen es un conteo global: otra prueba corriendo en paralelo puede
// seguir subiéndolo entre que se lee la API y que se pinta la pantalla.
function numeroDelPanel(page: Page, etiqueta: string) {
  return page.getByText(etiqueta, { exact: true }).locator('xpath=following-sibling::p[1]');
}

test('crear un cuidado registra cuidado_abierto y sube en el panel', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);

  const antes = await leerResumen(page);
  await agregarMascota(page, nombre);

  // El evento se registra en segundo plano (no bloquea el flujo real de crear la
  // mascota), así que puede tardar un instante más en reflejarse en el resumen.
  await expect.poll(async () => (await leerResumen(page)).iniciados).toBeGreaterThan(antes.iniciados);

  await page.goto('/analitica');
  await expect(page.getByRole('heading', { name: 'Analítica de cuidados' })).toBeVisible();
  await expect.poll(async () => Number(await numeroDelPanel(page, 'cuidado_abierto').innerText())).toBeGreaterThan(
    antes.iniciados,
  );
});

test('marcar un cuidado como realizado registra cuidado_completado y sube en el panel', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  const antes = await leerResumen(page);
  await tarjeta(page, nombre).getByRole('button', { name: 'Marcar como realizado' }).click();
  await page.getByRole('button', { name: 'Marcar como realizado' }).last().click();
  await expect(page.getByText(`se marcó como realizado`)).toBeVisible();

  await expect.poll(async () => (await leerResumen(page)).completados).toBeGreaterThan(antes.completados);

  await page.goto('/analitica');
  await expect(page.getByRole('heading', { name: 'Analítica de cuidados' })).toBeVisible();
  await expect
    .poll(async () => Number(await numeroDelPanel(page, 'cuidado_completado').innerText()))
    .toBeGreaterThan(antes.completados);
});
