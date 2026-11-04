import { test, expect, type Page } from '@playwright/test';

import { entrarConCuentaNueva } from './ayudantes';

// Solo pantallas sin fechas ni datos variables, para que las capturas sean estables.
// El indicador de "npm run dev" se oculta para que coincidan también en desarrollo.
async function compararPantalla(page: Page, archivo: string) {
  await page.addStyleTag({ content: 'nextjs-portal { display: none; }' });
  await expect(page).toHaveScreenshot(archivo, { fullPage: true, animations: 'disabled' });
}

test('La pantalla de ingreso se ve igual', async ({ page }) => {
  await page.goto('/ingresar');
  await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible();
  await compararPantalla(page, 'ingresar.png');
});

test('La pantalla de registro se ve igual', async ({ page }) => {
  await page.goto('/registro');
  await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeVisible();
  await compararPantalla(page, 'registro.png');
});

test('La lista vacía se ve igual', async ({ page }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);
  await expect(page.getByText('Aún no tienes mascotas.')).toBeVisible();
  await compararPantalla(page, 'lista-vacia.png');
});
