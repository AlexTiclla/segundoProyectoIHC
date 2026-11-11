import { redirect } from "next/navigation";

import BarraSuperior from "@/componentes/BarraSuperior";
import PanelAnalitica from "@/componentes/PanelAnalitica";
import { obtenerUsuarioActual } from "@/lib/apiServidor";

export default async function PaginaAnalitica() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/ingresar");

  return (
    <>
      <BarraSuperior nombreUsuario={usuario.nombreCompleto} actual="analitica" />
      <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <PanelAnalitica />
      </main>
    </>
  );
}
