import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

import {
  abrirMenu,
  agregarMascota,
  entrarConCuentaNueva,
  fechaConDias,
  fechaEnPantalla,
  tarjeta,
  textoUnico,
} from './ayudantes';

async function agregarRecurrente(
  page: Page,
  nombre: string,
  cuidado: string,
  repeticion: string,
  etiquetaCantidad: string,
  cantidad: string,
) {
  await page.getByRole('button', { name: 'Agregar mascota' }).click();
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Especie').selectOption('Perro');
  await page.getByLabel('Cuidado', { exact: true }).selectOption(cuidado);
  await page.getByLabel('Fecha del cuidado').fill(fechaConDias(0));
  await page.getByLabel('¿Se repite?').selectOption(repeticion);
  await page.getByLabel(etiquetaCantidad).fill(cantidad);
  await page.getByRole('button', { name: 'Crear mascota' }).click();
  await expect(page.getByRole('heading', { name: nombre })).toBeVisible();
}

function pendiente(page: Page, nombre: string) {
  return tarjeta(page, nombre).filter({ hasText: 'Pendiente' });
}

async function marcarRealizado(page: Page, nombre: string) {
  await pendiente(page, nombre).getByRole('button', { name: 'Marcar como realizado' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Marcar como realizado' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

test('Ana realiza un baño cada 7 días y aparece la próxima fecha correcta', async ({ page }, testInfo) => {
  const nombre = `Rocky${textoUnico(testInfo)}`;
  const proxima = fechaEnPantalla(fechaConDias(7));
  await entrarConCuentaNueva(page, testInfo);
  await agregarRecurrente(page, nombre, 'Baño', 'Cada ciertos días', 'Cada cuántos días', '7');

  await expect(tarjeta(page, nombre).getByText('Se repite cada 7 días')).toBeVisible();

  // Antes de confirmar ya se avisa qué va a pasar
  await tarjeta(page, nombre).getByRole('button', { name: 'Marcar como realizado' }).click();
  await expect(page.getByRole('dialog')).toContainText(`Se programará el próximo para el ${proxima}`);
  await page.getByRole('dialog').getByRole('button', { name: 'Marcar como realizado' }).click();

  await expect(page.getByText(`Próximo cuidado: ${proxima}`)).toBeVisible();
  await expect(tarjeta(page, nombre)).toHaveCount(2);
  await expect(tarjeta(page, nombre).getByText('Realizado', { exact: true })).toHaveCount(1);
  await expect(pendiente(page, nombre)).toContainText(proxima);
  await expect(pendiente(page, nombre)).toContainText('Pendiente · en 7 días');
  await expect(pendiente(page, nombre)).toContainText('Se repite cada 7 días');

  // Persistencia: sigue ahí al recargar
  await page.reload();
  await expect(pendiente(page, nombre)).toContainText(proxima);
});

test('Una vacuna cada año vuelve el mismo día del año siguiente', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  const hoy = new Date();
  const dentroDeUnAnio = new Date(hoy.getFullYear() + 1, hoy.getMonth(), hoy.getDate());
  // 29 de febrero: el año siguiente no lo tiene y queda en el 28
  if (dentroDeUnAnio.getMonth() !== hoy.getMonth()) dentroDeUnAnio.setDate(0);
  const proxima = dentroDeUnAnio.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });

  await entrarConCuentaNueva(page, testInfo);
  await agregarRecurrente(page, nombre, 'Vacuna', 'Cada ciertos años', 'Cada cuántos años', '1');
  await expect(tarjeta(page, nombre).getByText('Se repite cada año')).toBeVisible();

  await marcarRealizado(page, nombre);

  await expect(pendiente(page, nombre)).toContainText(proxima);
});

test('El historial guarda cada vez que se realiza', async ({ page }, testInfo) => {
  const nombre = `Rocky${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarRecurrente(page, nombre, 'Baño', 'Cada ciertos días', 'Cada cuántos días', '7');

  await marcarRealizado(page, nombre);
  await expect(tarjeta(page, nombre)).toHaveCount(2);
  await marcarRealizado(page, nombre);
  await expect(tarjeta(page, nombre)).toHaveCount(3);

  await page.getByRole('link', { name: 'Historial' }).click();
  const registros = page.getByRole('listitem');
  await expect(registros).toHaveCount(5);
  await expect(registros.filter({ hasText: 'Cuidado realizado' })).toHaveCount(2);
  await expect(registros.filter({ hasText: 'Próximo cuidado programado' })).toHaveCount(2);
  await expect(registros.first()).toContainText('Próximo cuidado programado');
  await expect(registros.first()).toContainText(fechaConDias(7));
});

test('Ana no puede guardar una repetición de 0 días', async ({ page }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);

  await page.getByRole('button', { name: 'Agregar mascota' }).click();
  await page.getByLabel('Nombre').fill(`Cero${textoUnico(testInfo)}`);
  await page.getByLabel('Especie').selectOption('Perro');
  await page.getByLabel('Cuidado', { exact: true }).selectOption('Baño');
  await page.getByLabel('Fecha del cuidado').fill(fechaConDias(0));
  await page.getByLabel('¿Se repite?').selectOption('Cada ciertos días');
  await page.getByLabel('Cada cuántos días').fill('0');
  await page.getByRole('button', { name: 'Crear mascota' }).click();

  await expect(page.getByText('Escribe un número entero de 1 a 365')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByText('Aún no tienes mascotas.')).toBeVisible();
});

test('Un cuidado que no se repite no genera otra tarjeta', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre, 'Control');

  await expect(tarjeta(page, nombre).getByText(/^Se repite/)).toBeHidden();
  await marcarRealizado(page, nombre);

  await expect(tarjeta(page, nombre).getByText('Realizado', { exact: true })).toBeVisible();
  await expect(tarjeta(page, nombre)).toHaveCount(1);
});

test('Ana edita un cuidado a "No se repite" y la serie se detiene', async ({ page }, testInfo) => {
  const nombre = `Rocky${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarRecurrente(page, nombre, 'Baño', 'Cada ciertos meses', 'Cada cuántos meses', '3');
  await expect(tarjeta(page, nombre).getByText('Se repite cada 3 meses')).toBeVisible();

  await abrirMenu(page, nombre, 'Editar');
  await expect(page.getByLabel('¿Se repite?')).toHaveValue('Cada ciertos meses');
  await expect(page.getByLabel('Cada cuántos meses')).toHaveValue('3');
  await page.getByLabel('¿Se repite?').selectOption('No se repite');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(tarjeta(page, nombre).getByText(/^Se repite/)).toBeHidden();
  await marcarRealizado(page, nombre);
  await expect(tarjeta(page, nombre).getByText('Realizado', { exact: true })).toBeVisible();
  await expect(tarjeta(page, nombre)).toHaveCount(1);
});

test('Al eliminar un cuidado recurrente se avisa que dejará de repetirse', async ({ page }, testInfo) => {
  const nombre = `Rocky${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarRecurrente(page, nombre, 'Baño', 'Cada ciertos días', 'Cada cuántos días', '7');

  await abrirMenu(page, nombre, 'Eliminar');
  await expect(page.getByRole('dialog')).toContainText('Dejará de repetirse');
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();

  await expect(page.getByText('Aún no tienes mascotas.')).toBeVisible();
});

test('El formulario con repetición no tiene fallas de accesibilidad', async ({ page }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);

  await page.getByRole('button', { name: 'Agregar mascota' }).click();
  await page.getByLabel('¿Se repite?').selectOption('Cada ciertos días');
  await page.getByRole('button', { name: 'Crear mascota' }).click();
  await expect(page.getByText('Escribe un número entero de 1 a 365')).toBeVisible();

  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(resultado.violations.map((falla) => `${falla.id}: ${falla.help}`)).toEqual([]);
});
