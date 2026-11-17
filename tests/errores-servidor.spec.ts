import { type Page } from '@playwright/test';
import { test, expect } from './base';

import { agregarMascota, entrarConCuentaNueva, fechaConDias, tarjeta, textoUnico } from './ayudantes';

// Qué ve la persona cuando el servidor falla o no responde. Los fallos se simulan con
// page.route, que intercepta la llamada del navegador antes de que llegue al backend.

const FALLA = 'El servidor no pudo completar la acción';

// Responde a una ruta de la API con un error 500 y el mensaje de FALLA
async function fallar(page: Page, ruta: string, metodo?: string) {
  await page.route(`**/api${ruta}`, (peticion) =>
    metodo && peticion.request().method() !== metodo
      ? peticion.fallback()
      : peticion.fulfill({ status: 500, json: { detail: FALLA } }),
  );
}

test('sin conexión con el servidor, la lista avisa que intente de nuevo', async ({ page }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);
  await page.route('**/api/mascotas/filtrar**', (peticion) => peticion.abort());
  await page.getByRole('group', { name: 'Tipo de cuidado' }).getByRole('button', { name: 'Vacuna' }).click();

  await expect(page.getByRole('alert').filter({ hasText: 'No se pudo conectar con el servidor. Intenta de nuevo.' })).toBeVisible();
});

test('si la sesión venció, la siguiente acción lleva a ingresar con el aviso', async ({
  page,
  context,
  cobertura,
}, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);
  await context.clearCookies();
  const tipos = page.getByRole('group', { name: 'Tipo de cuidado' });

  // Solo al medir la cobertura (Chromium): la app redirige con window.location, que
  // reemplaza el documento y con él lo que se midió en esta pantalla. Por eso, la primera
  // vez se frena la salida con un beforeunload (al descartar el diálogo, la pantalla se
  // queda) y se guarda lo medido. WebKit no muestra ese diálogo de forma fiable.
  if (cobertura.activa) {
    await page.evaluate(() => {
      window.onbeforeunload = (evento) => evento.preventDefault();
    });
    const intentoDeSalir = page.waitForEvent('dialog');
    await tipos.getByRole('button', { name: 'Vacuna' }).click();
    const dialogo = await intentoDeSalir;
    expect(dialogo.type()).toBe('beforeunload');
    await dialogo.dismiss();
    await cobertura.guardar();
    await page.evaluate(() => {
      window.onbeforeunload = null;
    });
  }

  // Se deja salir: llega a ingresar con el aviso
  await tipos.getByRole('button', { name: 'Baño' }).click();
  await expect(page).toHaveURL(/\/ingresar\?sesion=vencida/);
  await expect(page.getByText('Tu sesión venció. Ingresa de nuevo para continuar.')).toBeVisible();
});

test('si falla marcar como realizado, se ve el error y el cuidado sigue pendiente', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);
  await fallar(page, '/mascotas/*/realizar');

  await tarjeta(page, nombre).getByRole('button', { name: 'Marcar como realizado' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Marcar como realizado' }).click();

  await expect(page.getByRole('alert').filter({ hasText: FALLA })).toBeVisible();
  await expect(tarjeta(page, nombre)).toContainText('Pendiente');
});

test('si falla reprogramar, el error se ve dentro del formulario', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);
  await fallar(page, '/mascotas/*/reprogramar');

  await tarjeta(page, nombre).getByRole('button', { name: 'Reprogramar' }).click();
  await page.getByLabel('Nueva fecha').fill(fechaConDias(3));
  await page.getByLabel('Motivo').fill('Viaje');
  await page.getByRole('button', { name: 'Guardar fecha' }).click();

  await expect(page.getByRole('dialog').getByText(FALLA)).toBeVisible();
  // Se puede volver a intentar: el botón deja de estar ocupado
  await expect(page.getByRole('button', { name: 'Guardar fecha' })).toBeEnabled();
});

test('si no cargan los accesos, Compartir lo avisa', async ({ page }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);
  await fallar(page, '/accesos/enviados');
  await page.getByRole('link', { name: 'Compartir' }).click();

  await expect(page.getByRole('alert').filter({ hasText: FALLA })).toBeVisible();
});

test('si no carga la analítica, el panel lo avisa', async ({ page }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);
  await fallar(page, '/analitica/resumen');
  await page.getByRole('link', { name: 'Analítica' }).click();

  await expect(page.getByRole('alert').filter({ hasText: FALLA })).toBeVisible();
});

test('si falla eliminar la cuenta, se cierra el diálogo, se ve el error y la sesión sigue', async ({
  page,
}, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);
  await fallar(page, '/auth/cuenta', 'DELETE');
  await page.getByRole('link', { name: 'Mi cuenta' }).click();

  await page.getByRole('button', { name: 'Eliminar mi cuenta' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar mi cuenta' }).click();

  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('alert').filter({ hasText: FALLA })).toBeVisible();
  await expect(page).toHaveURL(/\/cuenta/);
});

// Si el servidor responde bien (200) pero con datos que no tienen la forma esperada,
// la app no muestra el detalle técnico: muestra un mensaje genérico.
async function responderSinDatos(page: Page, ruta: string, cuerpo: unknown) {
  await page.route(`**/api${ruta}`, (peticion) => peticion.fulfill({ status: 200, json: cuerpo }));
}

test('si la lista llega con datos inesperados, se ve un error genérico', async ({ page }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);
  await responderSinDatos(page, '/mascotas/filtrar**', {});
  await page.getByRole('group', { name: 'Tipo de cuidado' }).getByRole('button', { name: 'Vacuna' }).click();

  await expect(page.getByRole('alert').filter({ hasText: 'Ocurrió un error inesperado' })).toBeVisible();
});

test('si una acción llega con datos inesperados, se ve un error genérico', async ({ page }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);
  await responderSinDatos(page, '/mascotas/*/realizar', null);

  await tarjeta(page, nombre).getByRole('button', { name: 'Marcar como realizado' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Marcar como realizado' }).click();

  await expect(page.getByRole('alert').filter({ hasText: 'Ocurrió un error inesperado' })).toBeVisible();
});

test('si los accesos llegan con datos inesperados, Compartir lo avisa', async ({ page }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);
  await responderSinDatos(page, '/accesos/enviados', {});
  await page.getByRole('link', { name: 'Compartir' }).click();

  await expect(page.getByRole('alert').filter({ hasText: 'No se pudieron cargar los accesos.' })).toBeVisible();
});
