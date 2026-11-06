"use client";

import { useState, type FormEvent } from "react";

import { asignarResponsable, ErrorApi, type Mascota } from "@/lib/api";
import { validarCorreo } from "@/lib/validaciones";
import Boton from "./Boton";
import CampoTexto from "./CampoTexto";
import MensajeError from "./MensajeError";

type Props = {
  mascota: Mascota;
  alGuardar: (mensaje: string) => void;
  alCancelar: () => void;
};

export default function FormularioResponsable({ mascota, alGuardar, alCancelar }: Props) {
  const [correo, setCorreo] = useState("");
  const [errorCorreo, setErrorCorreo] = useState<string>();
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral("");

    const error = validarCorreo(correo);
    setErrorCorreo(error);
    if (error) return;

    setCargando(true);
    try {
      await asignarResponsable(mascota.id, correo.trim());
      alGuardar(`Responsable asignado al cuidado de ${mascota.nombre}`);
    } catch (e) {
      setErrorGeneral(e instanceof ErrorApi ? e.message : "Ocurrió un error inesperado");
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <MensajeError mensaje={errorGeneral} />
      <CampoTexto
        id="correoResponsable"
        etiqueta="Correo del responsable"
        tipo="email"
        valor={correo}
        alCambiar={setCorreo}
        error={errorCorreo}
        ayuda="Debe tener una cuenta en Mascota al Día."
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Boton texto="Cancelar" variante="secundario" alClic={alCancelar} deshabilitado={cargando} />
        <Boton texto="Asignar" textoCargando="Asignando..." cargando={cargando} />
      </div>
    </form>
  );
}
