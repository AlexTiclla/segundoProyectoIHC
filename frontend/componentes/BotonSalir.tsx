"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { salir } from "@/lib/api";
import Boton from "./Boton";

export default function BotonSalir() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  async function cerrarSesion() {
    setCargando(true);
    try {
      await salir();
    } finally {
      router.replace("/ingresar");
      router.refresh();
    }
  }

  return (
    <Boton
      texto="Cerrar sesión"
      textoCargando="Cerrando sesión..."
      cargando={cargando}
      variante="secundario"
      alClic={cerrarSesion}
    />
  );
}
