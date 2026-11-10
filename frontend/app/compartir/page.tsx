import { redirect } from "next/navigation";

import BarraSuperior from "@/componentes/BarraSuperior";
import PanelAccesos from "@/componentes/PanelAccesos";
import { obtenerUsuarioActual } from "@/lib/apiServidor";

export default async function PaginaCompartir() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/ingresar");

  return (
    <>
      <BarraSuperior nombreUsuario={usuario.nombreCompleto} actual="compartir" />
      <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <PanelAccesos />
      </main>
    </>
  );
}
