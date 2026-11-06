import { redirect } from "next/navigation";

import BarraSuperior from "@/componentes/BarraSuperior";
import PanelHistorial from "@/componentes/PanelHistorial";
import { obtenerUsuarioActual } from "@/lib/apiServidor";

export default async function PaginaHistorial() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/ingresar");

  return (
    <>
      <BarraSuperior nombreUsuario={usuario.nombreCompleto} actual="historial" />
      <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <PanelHistorial />
      </main>
    </>
  );
}
