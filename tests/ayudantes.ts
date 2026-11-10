import { expect, type Browser, type Page, type TestInfo } from '@playwright/test';

// Semilla de las pruebas: cada prueba crea su propia cuenta y sus propios datos.
// Así no depende de lo que ya exista en la base y puede correr en paralelo.

export const CONTRASENA = 'Prueba1234';

export type Cuenta = { nombre: string; correo: string };

let contador = 0;

// Un texto que no se repite entre pruebas, navegadores ni corridas
export function textoUnico(testInfo: TestInfo): string {
  contador += 1;
  return `${Date.now()}${testInfo.workerIndex}${contador}${testInfo.project.name}`;
}

export function fechaConDias(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// El mismo formato con el que la app muestra las fechas
export function fechaEnPantalla(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function crearCuenta(page: Page, testInfo: TestInfo, nombre = 'Ana Prueba'): Promise<Cuenta> {
  const correo = `prueba${textoUnico(testInfo)}@correo.com`;
  const respuesta = await page.request.post('/api/auth/registro', {
    data: { nombre_completo: nombre, correo, contrasena: CONTRASENA },
  });
  expect(respuesta.status()).toBe(201);
  return { nombre, correo };
}

// La cookie queda en el navegador de la prueba, porque page.request comparte sus cookies
export async function iniciarSesion(page: Page, correo: string) {
  const respuesta = await page.request.post('/api/auth/ingresar', {
    data: { correo, contrasena: CONTRASENA },
  });
  expect(respuesta.status()).toBe(200);
}

export async function entrarConCuentaNueva(page: Page, testInfo: TestInfo): Promise<Cuenta> {
  const cuenta = await crearCuenta(page, testInfo);
  await iniciarSesion(page, cuenta.correo);
  await page.goto('/inicio');
  await expect(page.getByRole('heading', { name: 'Mis mascotas' })).toBeVisible();
  return cuenta;
}

export async function agregarMascota(page: Page, nombre: string, cuidado = 'Vacuna', fecha = fechaConDias(0)) {
  await page.getByRole('button', { name: 'Agregar mascota' }).click();
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Especie').selectOption('Perro');
  await page.getByLabel('Cuidado', { exact: true }).selectOption(cuidado);
  await page.getByLabel('Fecha del cuidado').fill(fecha);
  await page.getByRole('button', { name: 'Crear mascota' }).click();
  await expect(page.getByRole('heading', { name: nombre })).toBeVisible();
}

export function tarjeta(page: Page, nombre: string) {
  return page.getByRole('article').filter({ has: page.getByRole('heading', { name: nombre }) });
}

export async function abrirMenu(page: Page, nombre: string, opcion: string) {
  const laTarjeta = tarjeta(page, nombre);
  await laTarjeta.getByRole('button', { name: /^Más acciones/ }).click();
  await laTarjeta.getByRole('button', { name: opcion }).click();
}

// Otra persona en su propio navegador: un contexto aparte, con su cuenta y su sesión
export async function abrirComo(browser: Browser, testInfo: TestInfo, nombre: string) {
  const contexto = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
  const page = await contexto.newPage();
  const cuenta = await crearCuenta(page, testInfo, nombre);
  await iniciarSesion(page, cuenta.correo);
  return { page, cuenta };
}

// Deja un acceso ya aceptado por la API, para las pruebas que no son del flujo de invitar. Devuelve su id.
export async function compartirCon(propietario: Page, invitado: { page: Page; cuenta: Cuenta }, permiso: 'consulta' | 'gestion') {
  const invitacion = await propietario.request.post('/api/accesos', {
    data: { correo: invitado.cuenta.correo, permiso },
  });
  expect(invitacion.status()).toBe(201);
  const { id } = await invitacion.json();
  const respuesta = await invitado.page.request.patch(`/api/accesos/${id}/aceptar`);
  expect(respuesta.status()).toBe(200);
  return id as number;
}
