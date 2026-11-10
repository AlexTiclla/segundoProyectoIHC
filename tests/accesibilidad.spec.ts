import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

import { abrirComo, agregarMascota, compartirCon, entrarConCuentaNueva, tarjeta, textoUnico } from './ayudantes';

async function revisarConAxe(page: Page) {
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(resultado.violations.map((falla) => `${falla.id}: ${falla.help}`)).toEqual([]);
}

for (const ruta of ['/ingresar', '/registro', '/recuperar']) {
  test(`${ruta} no tiene fallas de accesibilidad`, async ({ page }) => {
    await page.goto(ruta);
    await expect(page.getByRole('button').first()).toBeVisible();
    await revisarConAxe(page);
  });
}

test('La lista y el historial no tienen fallas de accesibilidad', async ({ page }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, `Luna${textoUnico(testInfo)}`);
  await revisarConAxe(page);

  await page.getByRole('link', { name: 'Historial' }).click();
  await expect(page.getByRole('listitem').first()).toBeVisible();
  await revisarConAxe(page);
});

test('La pantalla Compartir no tiene fallas de accesibilidad', async ({ page, browser }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);
  await compartirCon(page, await abrirComo(browser, testInfo, 'Juan Gestor'), 'gestion');

  await page.getByRole('link', { name: 'Compartir' }).click();
  await expect(page.getByText('Estado: Aceptado')).toBeVisible();
  await revisarConAxe(page);
});

test('El formulario abierto no tiene fallas de accesibilidad', async ({ page }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);

  await page.getByRole('button', { name: 'Agregar mascota' }).click();
  await page.getByRole('button', { name: 'Crear mascota' }).click();
  await expect(page.getByText('Escribe el nombre de tu mascota')).toBeVisible();

  await revisarConAxe(page);
});

// Fitts: lo que se toca seguido debe medir al menos 44 px de alto
test('Los botones de una tarjeta miden al menos 44 px', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  const botones = tarjeta(page, nombre).getByRole('button');
  const cantidad = await botones.count();
  expect(cantidad).toBeGreaterThan(0);

  for (let indice = 0; indice < cantidad; indice += 1) {
    const caja = await botones.nth(indice).boundingBox();
    expect(caja?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(caja?.width ?? 0).toBeGreaterThanOrEqual(44);
  }
});

// Regla de 3 toques: marcar un cuidado como realizado no debe pedir más
test('Marcar como realizado toma menos de 3 toques', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  let toques = 0;
  await tarjeta(page, nombre).getByRole('button', { name: 'Marcar como realizado' }).click();
  toques += 1;
  await page.getByRole('dialog').getByRole('button', { name: 'Marcar como realizado' }).click();
  toques += 1;

  await expect(tarjeta(page, nombre).getByText('Realizado', { exact: true })).toBeVisible();
  expect(toques).toBeLessThanOrEqual(3);
});
