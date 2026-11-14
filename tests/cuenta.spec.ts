import { test, expect } from "@playwright/test";

import {
  abrirComo,
  agregarMascota,
  compartirCon,
  entrarConCuentaNueva,
  tarjeta,
} from "./ayudantes";

test("la pantalla de Mi cuenta ofrece descargar los datos propios", async ({ page }, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);
  await page.getByRole("link", { name: "Mi cuenta" }).click();

  await expect(page.getByRole("link", { name: "Descargar en JSON" })).toHaveAttribute(
    "href",
    "/api/auth/mis-datos?formato=json",
  );
  await expect(page.getByRole("link", { name: "Descargar en CSV" })).toHaveAttribute(
    "href",
    "/api/auth/mis-datos?formato=csv",
  );

  const respuesta = await page.request.get("/api/auth/mis-datos?formato=json");
  expect(respuesta.headers()["content-disposition"]).toContain("attachment");
  const cuerpo = await respuesta.json();
  expect(cuerpo.perfil.correo).toBeTruthy();
});

test("eliminar la cuenta pide una confirmación honesta, con botones del mismo tamaño", async ({
  page,
}, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);
  await page.getByRole("link", { name: "Mi cuenta" }).click();
  await page.getByRole("button", { name: "Eliminar mi cuenta" }).click();

  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toContainText(/se revocarán de inmediato/i);
  await expect(dialogo).toContainText(/usuario eliminado/i);
  await expect(dialogo).toContainText(/no podrás volver a iniciar sesión/i);
  await expect(dialogo).toContainText(/no se puede deshacer/i);

  const cancelar = dialogo.getByRole("button", { name: "Cancelar" });
  const confirmar = dialogo.getByRole("button", { name: "Eliminar mi cuenta" });
  await expect(cancelar).toBeVisible();
  await expect(confirmar).toBeVisible();
  const cajaCancelar = await cancelar.boundingBox();
  const cajaConfirmar = await confirmar.boundingBox();
  expect(cajaCancelar?.height).toBe(cajaConfirmar?.height);
});

test("al eliminar la cuenta se revocan los accesos compartidos y se cierra la sesión", async ({
  page,
  browser,
}, testInfo) => {
  const ana = await entrarConCuentaNueva(page, testInfo);
  const juan = await abrirComo(browser, testInfo, "Juan Gestor");
  await compartirCon(page, juan, "gestion");

  await page.getByRole("link", { name: "Mi cuenta" }).click();
  await page.getByRole("button", { name: "Eliminar mi cuenta" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Eliminar mi cuenta" }).click();

  // La sesión termina con un aviso honesto, no silencioso
  await expect(page).toHaveURL(/\/ingresar\?cuenta=eliminada/);
  await expect(page.getByText("Tu cuenta fue eliminada. Los accesos compartidos quedaron revocados.")).toBeVisible();

  // Juan ya no tiene acceso: el acceso quedó revocado
  await juan.page.goto("/compartir");
  await expect(juan.page.getByText(/Estado: Revocado/)).toBeVisible();

  // No se puede volver a iniciar sesión con la cuenta eliminada
  const intento = await page.request.post("/api/auth/ingresar", {
    data: { correo: ana.correo, contrasena: "Prueba1234" },
  });
  expect(intento.status()).toBe(401);
});

test("los cuidados que realizó un invitado conservan «Usuario eliminado» como autor tras eliminar su cuenta", async ({
  page,
  browser,
}, testInfo) => {
  const nombre = `Luna${testInfo.workerIndex}${Date.now()}`;
  await entrarConCuentaNueva(page, testInfo);
  const juan = await abrirComo(browser, testInfo, "Juan Gestor");
  await agregarMascota(page, nombre);
  await compartirCon(page, juan, "gestion");

  await juan.page.goto("/inicio");
  await tarjeta(juan.page, nombre).getByRole("button", { name: "Marcar como realizado" }).click();
  await juan.page.getByRole("dialog").getByRole("button", { name: "Marcar como realizado" }).click();

  // Juan elimina su propia cuenta
  await juan.page.getByRole("link", { name: "Mi cuenta" }).click();
  await juan.page.getByRole("button", { name: "Eliminar mi cuenta" }).click();
  await juan.page.getByRole("dialog").getByRole("button", { name: "Eliminar mi cuenta" }).click();
  await expect(juan.page).toHaveURL(/\/ingresar\?cuenta=eliminada/);

  // Ana sigue viendo el cuidado, con el autor anonimizado, no borrado
  await page.goto("/inicio");
  await page
    .getByRole("group", { name: "Estado" })
    .getByRole("button", { name: "Realizados" })
    .click();
  await expect(tarjeta(page, nombre)).toContainText("Realizado por Usuario eliminado");
});
