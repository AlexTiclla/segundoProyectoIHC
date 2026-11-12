/**
 * Tarea 9 — pruebas E2E para SQLite local.
 * Guardar en: tests/cuidados-vencidos.spec.ts
 * Requiere: backend y frontend activos, backend/.env con URL_BASE_DATOS=sqlite:///./mascotas.db
 * Cada prueba crea su propia cuenta y cuidado. Solo modifica la fecha de ese cuidado.
 * NO ejecutar contra bases de datos compartidas o de producción.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

import {
  agregarMascota,
  entrarConCuentaNueva,
  fechaConDias,
  tarjeta,
  textoUnico,
} from "./ayudantes";

// Seguridad: no tocar una base local salvo que el ejecutor lo autorice explícitamente.
test.beforeEach(() => {
  test.skip(
    process.env.E2E_SQLITE_LOCAL !== "1",
    "Requiere E2E_SQLITE_LOCAL=1 y SQLite de desarrollo",
  );
});

type MascotaApi = {
  id: number;
  nombre: string;
  estado: string;
  fecha_cuidado: string;
  realizado_en: string | null;
  motivo_omision: string | null;
};

async function encontrarId(page: Page, nombre: string): Promise<number> {
  const respuesta = await page.request.get("/api/mascotas");
  expect(respuesta.status()).toBe(200);
  const lista = (await respuesta.json()) as MascotaApi[];
  const mascota = lista.find((item) => item.nombre === nombre);
  expect(mascota, `No se encontró el cuidado ${nombre}`).toBeDefined();
  return mascota!.id;
}

// Simula el paso del tiempo solo para la fila creada por esta prueba.
function marcarComoVencido(id: number, diasAtras = 2): void {
  const raiz = process.cwd();
  const base = path.join(raiz, "backend", "mascotas.db");
  const python = path.join(
    raiz,
    "backend",
    ".venv",
    ...(process.platform === "win32"
      ? ["Scripts", "python.exe"]
      : ["bin", "python"]),
  );
  if (!existsSync(base))
    throw new Error(`No se encontró SQLite local: ${base}`);
  if (!existsSync(python))
    throw new Error(`No se encontró el Python del backend: ${python}`);

  const fecha = fechaConDias(-diasAtras);
  const codigo = [
    "import sqlite3, sys",
    "bd, ident, fecha = sys.argv[1], int(sys.argv[2]), sys.argv[3]",
    "conexion = sqlite3.connect(bd)",
    'cursor = conexion.execute("UPDATE mascotas SET fecha_cuidado = ?, fecha_base = ? WHERE id = ? AND estado = ?", (fecha, fecha, ident, "pendiente"))',
    'assert cursor.rowcount == 1, "No se actualizó exactamente un cuidado pendiente"',
    "conexion.commit()",
    "conexion.close()",
  ].join("\n");
  execFileSync(python, ["-c", codigo, base, String(id), fecha], {
    stdio: "pipe",
  });
}

async function obtenerCuidado(page: Page, id: number): Promise<MascotaApi> {
  const respuesta = await page.request.get(`/api/mascotas/${id}`);
  expect(respuesta.status()).toBe(200);
  return respuesta.json() as Promise<MascotaApi>;
}

test("Tarea 9: omitir un cuidado vencido exige motivo y lo conserva", async ({
  page,
}, testInfo) => {
  const nombre = `OmitirT9${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await agregarMascota(page, nombre);
  const id = await encontrarId(page, nombre);
  marcarComoVencido(id);

  await page.reload();
  const tarjetaCuidado = tarjeta(page, nombre);
  await expect(
    tarjetaCuidado.getByRole("button", { name: "Omitir con motivo" }),
  ).toBeVisible();
  await tarjetaCuidado
    .getByRole("button", { name: "Omitir con motivo" })
    .click();

  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  const motivo = dialogo.locator("textarea");
  await expect(motivo).toBeVisible();
  // No debe admitir motivos vacíos.
  await expect(motivo).toHaveAttribute("required", "");

  const explicacion = "No pude asistir al control veterinario";
  await motivo.fill(explicacion);
  await dialogo
    .getByRole("button", { name: /omitir|confirmar/i })
    .last()
    .click();

  await expect
    .poll(async () => (await obtenerCuidado(page, id)).estado)
    .toBe("omitido");
  const guardado = await obtenerCuidado(page, id);
  expect(guardado.motivo_omision).toBe(explicacion);
  await expect(tarjeta(page, nombre)).toContainText("Omitido");
});

test("Tarea 9: realizado tarde registra hoy y mantiene la siguiente fecha planeada", async ({
  page,
}, testInfo) => {
  const nombre = `TardeT9${textoUnico(testInfo)}`;
  await entrarConCuentaNueva(page, testInfo);
  await page.getByRole("button", { name: "Agregar mascota" }).click();
  await page.getByLabel("Nombre").fill(nombre);
  await page.getByLabel("Especie").selectOption("Perro");
  await page.getByLabel("Cuidado", { exact: true }).selectOption("Baño");
  await page.getByLabel("Fecha del cuidado").fill(fechaConDias(0));
  await page.getByLabel("¿Se repite?").selectOption("Cada ciertos días");
  await page.getByLabel("Cada cuántos días").fill("7");
  await page.getByRole("button", { name: "Crear mascota" }).click();
  await expect(tarjeta(page, nombre)).toBeVisible();

  const id = await encontrarId(page, nombre);
  marcarComoVencido(id, 2);
  await page.reload();
  await expect(tarjeta(page, nombre)).toBeVisible();

  console.log("DATOS API:", await obtenerCuidado(page, id));
  console.log("TARJETA:", await tarjeta(page, nombre).innerText());
  console.log(
    "BOTONES:",
    await tarjeta(page, nombre).getByRole("button").allTextContents(),
  );
  await tarjeta(page, nombre)
    .getByRole("button", { name: "Realizado tarde" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Marcar como realizado" })
    .click();

  await expect
    .poll(async () => (await obtenerCuidado(page, id)).estado)
    .toBe("realizado");
  const realizado = await obtenerCuidado(page, id);
  expect(realizado.realizado_en).toBe(fechaConDias(0));

  const respuesta = await page.request.get("/api/mascotas");
  expect(respuesta.status()).toBe(200);
  const lista = (await respuesta.json()) as MascotaApi[];
  const siguiente = lista.filter(
    (item) => item.nombre === nombre && item.estado === "pendiente",
  );
  expect(siguiente).toHaveLength(1);
  // Fecha planeada original: hace 2 días; cada 7 días => dentro de 5 días.
  expect(siguiente[0].fecha_cuidado).toBe(fechaConDias(5));
});
