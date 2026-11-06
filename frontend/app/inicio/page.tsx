import { redirect } from "next/navigation";

import BarraSuperior from "@/componentes/BarraSuperior";
import PanelMascotas from "@/componentes/PanelMascota";
import { obtenerUsuarioActual } from "@/lib/apiServidor";

export default async function PaginaPrivada() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/ingresar");

  return (
    <>
      <BarraSuperior nombreUsuario={usuario.nombreCompleto} actual="mascotas" />
      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <PanelMascotas />
      </main>
    </>
  );
}
