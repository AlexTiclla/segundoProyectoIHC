import { test, expect } from '@playwright/test';

// Flujo principal de Mascota al Día: Semilla -> Login -> Crear -> Lo ve en pantalla.
// La "semilla" es una cuenta nueva creada en la misma prueba, así no depende
// de datos ya existentes en la base y no rompe nada si se corre varias veces.

test('Ana registra una mascota y la ve en su lista', async ({ page }) => {
  const sufijo = Date.now();
  const correo = `prueba${sufijo}@correo.com`;
  const contrasena = 'Prueba1234';
  const nombreMascota = `Firulais${sufijo}`;

  // Semilla: crear una cuenta nueva
  await page.goto('/registro');
  await page.getByLabel('Nombre completo').fill('Ana Prueba');
  await page.getByLabel('Correo').fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(contrasena);
  await page.getByLabel('Confirmar contraseña').fill(contrasena);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  // Login
  await expect(page).toHaveURL(/\/ingresar/);
  await page.getByLabel('Correo').fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(contrasena);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/inicio/);

  // Crear: registrar una mascota con su cuidado
  await page.getByRole('button', { name: 'Agregar mascota' }).click();
  await page.getByLabel('Nombre').fill(nombreMascota);
  await page.getByLabel('Especie').fill('perro');
  await page.getByLabel('Cuidado', { exact: true }).fill('vacuna');
  await page.getByLabel('Fecha del cuidado').fill(new Date().toISOString().slice(0, 10));
  await page.getByRole('button', { name: 'Crear mascota' }).click();

  // Lo ve en pantalla: mensaje de éxito y la mascota aparece en la lista
  await expect(page.getByText('Mascota creada con éxito')).toBeVisible();
  await expect(page.getByRole('heading', { name: nombreMascota })).toBeVisible();
});
