"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ErrorApi, eliminarCuenta, registrarEvento, urlMisDatos } from "@/lib/api";
import Boton from "./Boton";
import DialogoConfirmar from "./DialogoConfirmar";
import MensajeError from "./MensajeError";

export default function PanelCuenta() {
  const router = useRouter();
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [flujoId, setFlujoId] = useState<string>();
  const [error, setError] = useState("");

  function abrirDialogo() {
    const id = crypto.randomUUID();
    setFlujoId(id);
    registrarEvento("cuenta_eliminacion_iniciada", id);
    setError("");
    setDialogoAbierto(true);
  }

  async function confirmarEliminacion() {
    try {
      await eliminarCuenta();
      if (flujoId) registrarEvento("cuenta_eliminacion_exito", flujoId);
      router.replace("/ingresar?cuenta=eliminada");
      router.refresh();
    } catch (error) {
      setDialogoAbierto(false);
      setError(error instanceof ErrorApi ? error.message : "Ocurrió un error inesperado");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-contorno bg-white p-4 sm:p-6">
        <h2 className="mb-2 text-lg font-bold">Descargar mis datos</h2>
        <p className="mb-4 text-sm text-grisazulado">
          Incluye tu perfil, tus mascotas, tu historial de acciones y los accesos que
          otorgaste o recibiste.
        </p>
        <div className="flex flex-wrap gap-2">
          <Boton texto="Descargar en JSON" variante="secundario" href={urlMisDatos("json")} descargar />
          <Boton texto="Descargar en CSV" variante="secundario" href={urlMisDatos("csv")} descargar />
        </div>
      </section>

      <section className="rounded-2xl border border-contorno bg-white p-4 sm:p-6">
        <h2 className="mb-2 text-lg font-bold">Eliminar cuenta</h2>
        <p className="mb-4 text-sm text-grisazulado">
          Elimina tu acceso a Mascota al Día de forma permanente.
        </p>
        <MensajeError mensaje={error} />
        <Boton texto="Eliminar mi cuenta" variante="peligro" alClic={abrirDialogo} clase="mt-2" />
      </section>

      {dialogoAbierto && (
        <DialogoConfirmar
          titulo="¿Eliminar tu cuenta?"
          mensaje="Se eliminará tu acceso a Mascota al Día. Si compartes mascotas con otras cuentas, esos accesos se revocarán de inmediato. Los cuidados que ya realizaste quedarán registrados con «Usuario eliminado» como autor, no se borran del historial de las mascotas. No podrás volver a iniciar sesión con esta cuenta. Esta acción no se puede deshacer."
          textoConfirmar="Eliminar mi cuenta"
          peligroso
          alCerrar={() => setDialogoAbierto(false)}
          alConfirmar={confirmarEliminacion}
        />
      )}
    </div>
  );
}
