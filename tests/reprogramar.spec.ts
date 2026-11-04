import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

import {
  agregarMascota,
  entrarConCuentaNueva,
  fechaConDias,
  fechaEnPantalla,
  tarjeta,
  textoUnico,
} from './ayudantes';

// Escenario de la clase 19: mover solo una ocurrencia conserva las demás;
// moverla con las futuras desplaza solo las pendientes y mantiene el historial.

// El mismo formato corto con el que la tarjeta muestra las fechas
function fechaCorta(dias: number): string {
  const [anio, mes, dia] = fechaConDias(dias).split('-').map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function proximas(...dias: number[]): string {
  return `Próximas: ${dias.map(fechaCorta).join(', ')}`;
}

function pendiente(page: Page, nombre: string) {
  return tarjeta(page, nombre).filter({ hasText: 'Pendiente' });
}

async function agregarSemanal(page: Page, nombre: string) {
  await page.getByRole('button', { name: 'Agregar mascota' }).click();
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Especie').selectOption('Perro');
  await page.getByLabel('Cuidado', { exact: true }).selectOption('Baño');
  await page.getByLabel('Fecha del cuidado').fill(fechaConDias(0));
  await page.getByLabel('¿Se repite?').selectOption('Cada ciertos días');
  await page.getByLabel('Cada cuántos días').fill('7');
  await page.getByRole('button', { name: 'Crear mascota' }).click();
  await expect(page.getByRole('heading', { name: nombre })).toBeVisible();
}

async function reprogramar(page: Page, nombre: string, dias: number, motivo: string, alcance?: string) {
  await pendiente(page, nombre).getByRole('button', { name: 'Reprogramar' }).click();
  await page.getByLabel('Nueva fecha').fill(fechaConDias(dias));
  await page.getByLabel('Motivo').fill(motivo);
  if (alcance) await page.getByRole('dialog').getByRole('button', { name: alcance }).click();
}

async function guardar(page: Page) {
  await page.getByRole('button', { name: 'Guardar fecha' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

test('Mover solo esta fecha conserva las demás', async ({ page }, testInfo) => {
  const nombre = `Rocky${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarSemanal(page, nombre);
  await expect(tarjeta(page, nombre)).toContainText(proximas(7, 14, 21));

  await reprogramar(page, nombre, 2, 'La clínica cierra hoy', 'Solo esta fecha');
  await expect(page.getByRole('dialog')).toContainText(`Las siguientes siguen igual: ${fechaCorta(7)}`);
  await guardar(page);

  await expect(tarjeta(page, nombre)).toContainText(fechaEnPantalla(fechaConDias(2)));
  await expect(tarjeta(page, nombre)).toContainText(proximas(7, 14, 21));
  await expect(tarjeta(page, nombre)).toContainText(`Fecha original: ${fechaCorta(0)}`);

  // Al realizarla, la siguiente cae en la fecha que no se movió
  await pendiente(page, nombre).getByRole('button', { name: 'Marcar como realizado' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Marcar como realizado' }).click();
  await expect(pendiente(page, nombre)).toContainText(fechaEnPantalla(fechaConDias(7)));
  await expect(tarjeta(page, nombre)).toHaveCount(2);
});

test('Mover también las siguientes desplaza solo las pendientes y mantiene el historial', async ({ page }, testInfo) => {
  const nombre = `Rocky${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarSemanal(page, nombre);

  // Un cuidado ya realizado y su siguiente, pendiente en 7 días
  await tarjeta(page, nombre).getByRole('button', { name: 'Marcar como realizado' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Marcar como realizado' }).click();
  await expect(tarjeta(page, nombre)).toHaveCount(2);
  const realizado = tarjeta(page, nombre).filter({ has: page.getByText('Realizado', { exact: true }) });

  await reprogramar(page, nombre, 10, 'Vamos de viaje', 'Esta y las siguientes');
  await expect(page.getByRole('dialog')).toContainText('Las siguientes se moverán 3 días después');
  await guardar(page);

  await expect(pendiente(page, nombre)).toContainText(fechaEnPantalla(fechaConDias(10)));
  await expect(pendiente(page, nombre)).toContainText(proximas(17, 24, 31));

  // El realizado no cambia y no se crean duplicados, también al recargar
  await page.reload();
  await expect(tarjeta(page, nombre)).toHaveCount(2);
  await expect(realizado).toContainText(fechaEnPantalla(fechaConDias(0)));
  await expect(realizado.getByText('Fecha original')).toBeHidden();
  await expect(pendiente(page, nombre)).toContainText(proximas(17, 24, 31));

  // Se conservan la fecha original y los cambios anteriores
  await reprogramar(page, nombre, 12, 'Cambió el viaje', 'Esta y las siguientes');
  await guardar(page);
  await expect(pendiente(page, nombre)).toContainText(`Fecha original: ${fechaCorta(7)}`);
  await pendiente(page, nombre).getByText('Ver cambios (2)').click();
  await expect(pendiente(page, nombre).getByText('Motivo: Vamos de viaje')).toBeVisible();
  await expect(pendiente(page, nombre).getByText('Motivo: Cambió el viaje')).toBeVisible();

  await page.getByRole('link', { name: 'Historial' }).click();
  const cambios = page.getByRole('listitem').filter({ hasText: 'Reprogramación' });
  await expect(cambios).toHaveCount(2);
  await expect(cambios.last()).toContainText(fechaConDias(7));
  await expect(cambios.last()).toContainText(fechaConDias(10));
  await expect(cambios.last()).toContainText('esta y las siguientes');
  await expect(cambios.last()).toContainText('Motivo: Vamos de viaje');
});

test('Sin motivo no se reprograma', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  await tarjeta(page, nombre).getByRole('button', { name: 'Reprogramar' }).click();
  await page.getByLabel('Nueva fecha').fill(fechaConDias(5));
  await page.getByRole('button', { name: 'Guardar fecha' }).click();
  await expect(page.getByText('Escribe el motivo del cambio')).toBeVisible();

  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();
  await expect(tarjeta(page, nombre)).toContainText('Pendiente · hoy');
  await expect(tarjeta(page, nombre).getByText('Fecha original')).toBeHidden();
});

test('La misma fecha no cuenta como cambio', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  await tarjeta(page, nombre).getByRole('button', { name: 'Reprogramar' }).click();
  await page.getByLabel('Motivo').fill('Sin cambio');
  await page.getByRole('button', { name: 'Guardar fecha' }).click();

  await expect(page.getByText('Elige una fecha distinta a la actual')).toBeVisible();
});

test('Un cuidado que no se repite no pregunta qué fechas mover', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);

  await tarjeta(page, nombre).getByRole('button', { name: 'Reprogramar' }).click();

  await expect(page.getByLabel('Motivo')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Esta y las siguientes' })).toBeHidden();
});

test('El formulario de reprogramar no tiene fallas de accesibilidad', async ({ page }, testInfo) => {
  const nombre = `Rocky${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarSemanal(page, nombre);

  await tarjeta(page, nombre).getByRole('button', { name: 'Reprogramar' }).click();
  await page.getByRole('button', { name: 'Guardar fecha' }).click();
  await expect(page.getByText('Escribe el motivo del cambio')).toBeVisible();

  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(resultado.violations.map((falla) => `${falla.id}: ${falla.help}`)).toEqual([]);
});
