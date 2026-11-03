import { redirect } from "next/navigation";

import BotonSalir from "@/componentes/BotonSalir";
import { obtenerUsuarioActual } from "@/lib/apiServidor";
import PanelMascotas from "@/componentes/PanelMascota";
import Boton from "@/componentes/Boton";

export default async function PaginaPrivada() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/ingresar");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-6 text-center">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Hola Mundo, {usuario.nombreCompleto}</h1> 
        <BotonSalir />
      </header>
      <PanelMascotas/>
      <Boton texto="Ver historial de acciones" href="/historial" variante="secundario" />
    </main>
  );
}