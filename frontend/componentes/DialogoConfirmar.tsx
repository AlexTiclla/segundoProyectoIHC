"use client";

import { useState } from "react";

import Boton from "./Boton";
import Dialogo from "./Dialogo";

type Props = {
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  peligroso?: boolean;
  alConfirmar: () => Promise<void>;
  alCerrar: () => void;
};

export default function DialogoConfirmar({
  titulo,
  mensaje,
  textoConfirmar,
  peligroso = false,
  alConfirmar,
  alCerrar,
}: Props) {
  const [cargando, setCargando] = useState(false);

  async function confirmar() {
    setCargando(true);
    await alConfirmar();
  }

  return (
    <Dialogo titulo={titulo} alCerrar={alCerrar}>
      <p className="mb-6">{mensaje}</p>
      <div className="flex flex-wrap justify-end gap-2">
        <Boton texto="Cancelar" variante="secundario" alClic={alCerrar} deshabilitado={cargando} />
        <Boton
          texto={textoConfirmar}
          textoCargando="Guardando..."
          cargando={cargando}
          variante={peligroso ? "peligro" : "primario"}
          alClic={confirmar}
        />
      </div>
    </Dialogo>
  );
}
