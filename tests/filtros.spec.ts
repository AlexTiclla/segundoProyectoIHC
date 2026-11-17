import { test, expect } from './base';

import { crearCuidadoPorApi, entrarConCuentaNueva, fechaConDias, fechaEnPantalla, textoUnico } from './ayudantes';

// Filtros de la lista de cuidados: por nombre, por fecha y en pantalla de celular.

test('Ana busca por nombre y quita el filtro con su botón', async ({ page }, testInfo) => {
  const sufijo = textoUnico(testInfo);
  await entrarConCuentaNueva(page, testInfo);
  await crearCuidadoPorApi(page, { nombre: `Luna${sufijo}` });
  await crearCuidadoPorApi(page, { nombre: `Rocky${sufijo}` });
  await page.reload();
  await expect(page.getByRole('status').filter({ hasText: '2 cuidados' })).toBeVisible();

  await page.getByLabel('Buscar mascota').fill(`Luna${sufijo}`);
  await expect(page.getByRole('status').filter({ hasText: '1 cuidado' })).toBeVisible();
  await expect(page.getByRole('heading', { name: `Rocky${sufijo}` })).toBeHidden();

  await page.getByRole('button', { name: `Quitar filtro Nombre: Luna${sufijo}` }).click();
  await expect(page.getByLabel('Buscar mascota')).toHaveValue('');
  await expect(page.getByRole('status').filter({ hasText: '2 cuidados' })).toBeVisible();
});

test('Ana ve solo los cuidados de los próximos 7 días', async ({ page }, testInfo) => {
  const sufijo = textoUnico(testInfo);
  await entrarConCuentaNueva(page, testInfo);
  await crearCuidadoPorApi(page, { nombre: `Pronto${sufijo}`, fecha: fechaConDias(2) });
  await crearCuidadoPorApi(page, { nombre: `Lejos${sufijo}`, fecha: fechaConDias(30) });
  await page.reload();

  await page.getByRole('group', { name: 'Fecha' }).getByRole('button', { name: 'Próximos 7 días' }).click();

  await expect(page.getByRole('button', { name: 'Quitar filtro Próximos 7 días' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: '1 cuidado' })).toBeVisible();
  await expect(page.getByRole('heading', { name: `Pronto${sufijo}` })).toBeVisible();
});

test('Ana elige un rango de fechas: desde, hasta o ambas', async ({ page }, testInfo) => {
  const sufijo = textoUnico(testInfo);
  const desde = fechaConDias(5);
  const hasta = fechaConDias(20);
  await entrarConCuentaNueva(page, testInfo);
  await crearCuidadoPorApi(page, { nombre: `Antes${sufijo}`, fecha: fechaConDias(1) });
  await crearCuidadoPorApi(page, { nombre: `Dentro${sufijo}`, fecha: fechaConDias(10) });
  await crearCuidadoPorApi(page, { nombre: `Despues${sufijo}`, fecha: fechaConDias(40) });
  await page.reload();
  await expect(page.getByRole('status').filter({ hasText: '3 cuidados' })).toBeVisible();

  await page.getByRole('group', { name: 'Fecha' }).getByRole('button', { name: 'Elegir fechas' }).click();

  await page.getByLabel('Desde').fill(desde);
  await expect(page.getByRole('button', { name: `Quitar filtro Desde el ${fechaEnPantalla(desde)}` })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: '2 cuidados' })).toBeVisible();

  await page.getByLabel('Hasta').fill(hasta);
  await expect(
    page.getByRole('button', { name: `Quitar filtro Del ${fechaEnPantalla(desde)} al ${fechaEnPantalla(hasta)}` }),
  ).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: '1 cuidado' })).toBeVisible();
  await expect(page.getByRole('heading', { name: `Dentro${sufijo}` })).toBeVisible();

  await page.getByLabel('Desde').fill('');
  const soloHasta = page.getByRole('button', { name: `Quitar filtro Hasta el ${fechaEnPantalla(hasta)}` });
  await expect(soloHasta).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: '2 cuidados' })).toBeVisible();

  // Quitar el filtro de fecha vuelve a "Todas" y oculta los campos del rango
  await soloHasta.click();
  await expect(page.getByLabel('Hasta')).toBeHidden();
  await expect(page.getByRole('status').filter({ hasText: '3 cuidados' })).toBeVisible();
});

test.describe('En pantalla de celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('el panel de filtros se abre con su botón, que cuenta los filtros elegidos', async ({ page }, testInfo) => {
    await entrarConCuentaNueva(page, testInfo);
    const panel = page.getByRole('region', { name: 'Filtros de cuidados' });
    const boton = page.getByRole('button', { name: /^Filtros/ });

    await expect(panel).toBeHidden();
    await expect(boton).toHaveAttribute('aria-expanded', 'false');

    await boton.click();
    await expect(panel).toBeVisible();
    await expect(boton).toHaveAttribute('aria-expanded', 'true');

    await panel.getByRole('group', { name: 'Tipo de cuidado' }).getByRole('button', { name: 'Vacuna' }).click();
    await expect(boton).toHaveText(/Filtros \(1\)/);

    await boton.click();
    await expect(panel).toBeHidden();
  });
});
