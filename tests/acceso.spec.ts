import { test, expect, type Page } from '@playwright/test';

import { CONTRASENA, crearCuenta, entrarConCuentaNueva, textoUnico } from './ayudantes';

async function ingresarPorPantalla(page: Page, correo: string, contrasena: string) {
  await page.goto('/ingresar');
  await page.getByLabel('Correo').fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(contrasena);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

test('Ana crea su cuenta e ingresa', async ({ page }, testInfo) => {
  const correo = `nueva${textoUnico(testInfo)}@correo.com`;

  await page.goto('/registro');
  await page.getByLabel('Nombre completo').fill('Ana Prueba');
  await page.getByLabel('Correo').fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(CONTRASENA);
  await page.getByLabel('Confirmar contraseña').fill(CONTRASENA);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  await expect(page.getByText('Cuenta creada. Ahora inicia sesión.')).toBeVisible();

  await ingresarPorPantalla(page, correo, CONTRASENA);
  await expect(page).toHaveURL(/\/inicio/);
  await expect(page.getByRole('heading', { name: 'Mis mascotas' })).toBeVisible();
});

test('Ana no puede registrar un correo que ya existe', async ({ page }, testInfo) => {
  const { correo } = await crearCuenta(page, testInfo);

  await page.goto('/registro');
  await page.getByLabel('Nombre completo').fill('Otra Persona');
  await page.getByLabel('Correo').fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(CONTRASENA);
  await page.getByLabel('Confirmar contraseña').fill(CONTRASENA);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(/\/registro/);
});

test('Ana ve un error si su contraseña es incorrecta', async ({ page }, testInfo) => {
  const { correo } = await crearCuenta(page, testInfo);

  await ingresarPorPantalla(page, correo, 'NoEsLaClave99');

  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(/\/ingresar/);
});

test('Ana recupera su contraseña con el código', async ({ page }, testInfo) => {
  const { correo } = await crearCuenta(page, testInfo);
  const nueva = 'ClaveNueva5678';

  await page.goto('/recuperar');
  await page.getByLabel('Correo de tu cuenta').fill(correo);
  await page.getByRole('button', { name: 'Generar código' }).click();

  // El código se muestra en pantalla porque la tarea no pide enviar correos reales
  const codigo = await page.getByText(/^\d{6}$/).textContent();
  await page.getByLabel('Código de 6 números').fill(codigo ?? '');
  await page.getByLabel('Contraseña nueva', { exact: true }).fill(nueva);
  await page.getByLabel('Confirmar contraseña nueva').fill(nueva);
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click();
  await expect(page.getByText('Contraseña actualizada.')).toBeVisible();

  await ingresarPorPantalla(page, correo, nueva);
  await expect(page).toHaveURL(/\/inicio/);
});

test('Ana ve un error si escribe un código de recuperación equivocado', async ({ page }, testInfo) => {
  const { correo } = await crearCuenta(page, testInfo);

  await page.goto('/recuperar');
  await page.getByLabel('Correo de tu cuenta').fill(correo);
  await page.getByRole('button', { name: 'Generar código' }).click();

  const codigo = await page.getByText(/^\d{6}$/).textContent();
  const equivocado = codigo === '000000' ? '111111' : '000000';
  await page.getByLabel('Código de 6 números').fill(equivocado);
  await page.getByLabel('Contraseña nueva', { exact: true }).fill('ClaveNueva5678');
  await page.getByLabel('Confirmar contraseña nueva').fill('ClaveNueva5678');
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click();

  await expect(page.getByRole('alert')).toBeVisible();
});

test('Ana cierra sesión y ya no puede volver a su lista', async ({ page }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/ingresar/);

  await page.goto('/inicio');
  await expect(page).toHaveURL(/\/ingresar/);
});

for (const ruta of ['/inicio', '/historial']) {
  test(`Sin sesión, ${ruta} lleva al login`, async ({ page }) => {
    await page.goto(ruta);
    await expect(page).toHaveURL(/\/ingresar/);
    await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
  });
}
