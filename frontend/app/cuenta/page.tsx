import { redirect } from "next/navigation";

import BarraSuperior from "@/componentes/BarraSuperior";
import PanelCuenta from "@/componentes/PanelCuenta";
import { obtenerUsuarioActual } from "@/lib/apiServidor";

export default async function PaginaCuenta() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/ingresar");

  return (
    <>
      <BarraSuperior nombreUsuario={usuario.nombreCompleto} actual="cuenta" />
      <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <h1 className="mb-6 text-2xl font-bold">Mi cuenta</h1>
        <PanelCuenta />
      </main>
    </>
  );
}
