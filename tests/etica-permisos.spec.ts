import { test, expect } from "@playwright/test";

import { entrarConCuentaNueva } from "./ayudantes";

// Clase 22 - Patrones oscuros: antes de invitar, la persona debe entender
// qué puede hacer cada permiso y qué alcance tiene, no solo marcar una opción.
test("el formulario de compartir explica el alcance real de cada permiso antes de invitar", async ({
  page,
}, testInfo) => {
  await entrarConCuentaNueva(page, testInfo);
  await page.getByRole("link", { name: "Compartir" }).click();

  // Consulta sigue siendo el valor por defecto: esto ya funcionaba bien.
  await expect(page.getByLabel("Permiso")).toHaveValue("Consulta");

  const ayuda = page.locator("#permisoInvitado-ayuda");

  // Gestión no es solo "editar": también permite omitir cuidados vencidos,
  // y eso debe quedar dicho antes de enviar la invitación.
  await expect(ayuda).toContainText(/omitir cuidados vencidos/i);

  // El alcance (todos los cuidados, incluidos los futuros) debe ser explícito.
  await expect(ayuda).toContainText(/futuros/i);
});
