import { test, expect, type Page } from '@playwright/test';

import {
  abrirComo,
  agregarMascota,
  compartirCon,
  entrarConCuentaNueva,
  fechaConDias,
  fechaEnPantalla,
  tarjeta,
  textoUnico,
} from './ayudantes';

async function invitar(page: Page, correo: string, permiso: 'Consulta' | 'Gestión') {
  await page.getByLabel('Correo de la persona').fill(correo);
  await page.getByLabel('Permiso').selectOption(permiso);
  await page.getByRole('button', { name: 'Invitar' }).click();
}

// Cada acceso es una fila de la lista; se busca por el nombre de la otra persona
function fila(page: Page, nombre: string) {
  return page.getByRole('listitem').filter({ hasText: nombre });
}

// La pantalla muestra solo los pendientes; los cuidados realizados están en este filtro
async function verRealizados(page: Page) {
  await page.getByRole('group', { name: 'Estado' }).getByRole('button', { name: 'Realizados' }).click();
}

test('Ana comparte sus cuidados: Juan gestiona, Eva consulta, y al revocar queda quién lo realizó', async ({ page, browser }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  const hoy = fechaEnPantalla(fechaConDias(0));
  await entrarConCuentaNueva(page, testInfo);
  const juan = await abrirComo(browser, testInfo, 'Juan Gestor');
  const eva = await abrirComo(browser, testInfo, 'Eva Lectora');
  await agregarMascota(page, nombre);

  // Ana invita a Juan con gestión y a Eva con consulta; las dos quedan pendientes
  await page.getByRole('link', { name: 'Compartir' }).click();
  await invitar(page, juan.cuenta.correo, 'Gestión');
  await expect(fila(page, 'Juan Gestor')).toContainText('Permiso: Gestión · Estado: Pendiente');
  await invitar(page, eva.cuenta.correo, 'Consulta');
  await expect(fila(page, 'Eva Lectora')).toContainText('Permiso: Consulta · Estado: Pendiente');

  // Mientras no aceptan, no ven nada
  await juan.page.goto('/inicio');
  await expect(juan.page.getByText('Ningún cuidado coincide con los filtros.')).toBeVisible();

  // Juan y Eva aceptan; el estado queda guardado al recargar
  for (const invitado of [juan, eva]) {
    await invitado.page.goto('/compartir');
    await fila(invitado.page, 'Ana Prueba').getByRole('button', { name: 'Aceptar' }).click();
    await expect(fila(invitado.page, 'Ana Prueba')).toContainText('Estado: Aceptado');
    await invitado.page.reload();
    await expect(fila(invitado.page, 'Ana Prueba')).toContainText('Estado: Aceptado');
  }

  // Juan (gestión) ve el cuidado y puede actuar, pero no eliminar ni asignar responsable
  await juan.page.goto('/inicio');
  await expect(tarjeta(juan.page, nombre)).toContainText('Compartido por Ana Prueba · Gestión');
  await expect(tarjeta(juan.page, nombre).getByRole('button', { name: 'Reprogramar' })).toBeVisible();
  await expect(tarjeta(juan.page, nombre).getByRole('button', { name: /^Más acciones/ })).toHaveCount(0);

  // Eva (consulta) lo ve, pero sin ninguna acción
  await eva.page.goto('/inicio');
  await expect(tarjeta(eva.page, nombre)).toContainText('Compartido por Ana Prueba · Consulta');
  await expect(tarjeta(eva.page, nombre).getByRole('button')).toHaveCount(0);

  // Juan lo marca como realizado
  await tarjeta(juan.page, nombre).getByRole('button', { name: 'Marcar como realizado' }).click();
  await juan.page.getByRole('dialog').getByRole('button', { name: 'Marcar como realizado' }).click();
  await expect(juan.page.getByText(`El cuidado de ${nombre} se marcó como realizado`)).toBeVisible();
  await verRealizados(juan.page);
  await expect(tarjeta(juan.page, nombre)).toContainText(`Realizado por Juan Gestor el ${hoy}`);

  // Ana revoca a Juan
  await page.goto('/compartir');
  await fila(page, 'Juan Gestor').getByRole('button', { name: 'Revocar' }).click();
  await expect(fila(page, 'Juan Gestor')).toContainText('Estado: Revocado');
  await expect(fila(page, 'Juan Gestor').getByRole('button', { name: 'Revocar' })).toBeHidden();
  await expect(fila(page, 'Eva Lectora')).toContainText('Estado: Aceptado');

  // Juan ya no ve el cuidado, ni al recargar
  await juan.page.reload();
  await verRealizados(juan.page);
  await expect(juan.page.getByText('Ningún cuidado coincide con los filtros.')).toBeVisible();

  // Eva sigue con acceso y ve quién lo realizó; Ana también, aunque Juan ya no tenga acceso
  for (const persona of [eva.page, page]) {
    await persona.goto('/inicio');
    await verRealizados(persona);
    await expect(tarjeta(persona, nombre)).toContainText(`Realizado por Juan Gestor el ${hoy}`);
  }
});

test('Quien consulta no modifica y solo Ana administra los accesos', async ({ page, browser }, testInfo) => {
  const nombre = `Luna${textoUnico(testInfo)}`;
  const ana = await entrarConCuentaNueva(page, testInfo);
  const juan = await abrirComo(browser, testInfo, 'Juan Gestor');
  const eva = await abrirComo(browser, testInfo, 'Eva Lectora');
  await agregarMascota(page, nombre);
  const [{ id }] = await (await page.request.get('/api/mascotas')).json();
  await compartirCon(page, juan, 'gestion');
  const accesoEva = await compartirCon(page, eva, 'consulta');

  // Eva solo consulta: marcar como realizado le da 403
  const realizar = await eva.page.request.patch(`/api/mascotas/${id}/realizar`);
  expect(realizar.status()).toBe(403);
  expect((await realizar.json()).detail).toContain('solo de consulta');

  // Juan gestiona, pero no elimina ni revoca accesos que no son suyos
  expect((await juan.page.request.delete(`/api/mascotas/${id}`)).status()).toBe(404);
  expect((await juan.page.request.patch(`/api/accesos/${accesoEva}/revocar`)).status()).toBe(404);

  // Nada cambió: el cuidado sigue pendiente y los dos accesos, aceptados
  await page.goto('/inicio');
  await expect(tarjeta(page, nombre).getByText(/^Pendiente/)).toBeVisible();
  await page.goto('/compartir');
  await expect(page.getByText('Estado: Aceptado')).toHaveCount(2);

  // No se invita dos veces a la misma cuenta, ni a uno mismo
  await invitar(page, juan.cuenta.correo, 'Consulta');
  await expect(page.getByRole('alert').filter({ hasText: 'Ya hay una invitación vigente para esa cuenta' })).toBeVisible();
  await invitar(page, ana.correo, 'Consulta');
  await expect(page.getByRole('alert').filter({ hasText: 'No puedes compartir tus cuidados contigo mismo' })).toBeVisible();
  await expect(page.getByText('Estado: Aceptado')).toHaveCount(2);
});
