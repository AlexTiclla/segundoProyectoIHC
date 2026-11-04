"use client";

import { useState, type FormEvent } from "react";

import { ErrorApi, reprogramarCuidado, type Mascota } from "@/lib/api";
import { formatearFecha } from "@/lib/fechas";
import { fechaHoy, validarNuevaFecha } from "@/lib/validaciones";
import Boton from "./Boton";
import CampoTexto from "./CampoTexto";
import MensajeError from "./MensajeError";

type Props = {
  mascota: Mascota;
  alGuardar: (mensaje: string) => void;
  alCancelar: () => void;
};

export default function FormularioReprogramar({ mascota, alGuardar, alCancelar }: Props) {
  const [fecha, setFecha] = useState(mascota.fechaCuidado);
  const [errorFecha, setErrorFecha] = useState<string>();
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral("");

    const error = validarNuevaFecha(fecha);
    setErrorFecha(error);
    if (error) return;

    setCargando(true);
    try {
      await reprogramarCuidado(mascota.id, fecha);
      alGuardar(`El cuidado de ${mascota.nombre} se reprogramó con éxito`);
    } catch (e) {
      setErrorGeneral(e instanceof ErrorApi ? e.message : "Ocurrió un error inesperado");
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <p className="text-sm text-grisazulado">
        {mascota.cuidado} · fecha actual: {formatearFecha(mascota.fechaCuidado)}
      </p>
      <MensajeError mensaje={errorGeneral} />
      <CampoTexto
        id="nuevaFecha"
        etiqueta="Nueva fecha"
        tipo="date"
        valor={fecha}
        min={fechaHoy()}
        alCambiar={setFecha}
        error={errorFecha}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Boton texto="Cancelar" variante="secundario" alClic={alCancelar} deshabilitado={cargando} />
        <Boton texto="Guardar fecha" textoCargando="Guardando..." cargando={cargando} />
      </div>
    </form>
  );
}
