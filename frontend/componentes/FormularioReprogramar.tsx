"use client";

import { useState, type FormEvent } from "react";

import { ErrorApi, reprogramarCuidado, type AlcanceReprogramacion, type Mascota } from "@/lib/api";
import { diasHasta, formatearFecha, formatearFechaCorta } from "@/lib/fechas";
import { fechaHoy, validarMotivo, validarNuevaFecha } from "@/lib/validaciones";
import Boton from "./Boton";
import CampoTexto from "./CampoTexto";
import GrupoChips from "./GrupoChips";
import MensajeError from "./MensajeError";

type Props = {
  mascota: Mascota;
  alGuardar: (mensaje: string) => void;
  alCancelar: () => void;
};

const OPCIONES_ALCANCE: { valor: AlcanceReprogramacion; texto: string }[] = [
  { valor: "solo_esta", texto: "Solo esta fecha" },
  { valor: "futuras", texto: "Esta y las siguientes" },
];

// Explica qué va a pasar con las siguientes fechas antes de guardar
function textoSiguientes(mascota: Mascota, fecha: string, alcance: AlcanceReprogramacion): string {
  if (alcance === "solo_esta") {
    return `Las siguientes siguen igual: ${mascota.proximasFechas.map(formatearFechaCorta).join(", ")}.`;
  }
  const diferencia = fecha ? diasHasta(fecha) - diasHasta(mascota.fechaCuidado) : 0;
  if (diferencia === 0) return "Las siguientes se moverán los mismos días que esta fecha.";
  const dias = Math.abs(diferencia) === 1 ? "1 día" : `${Math.abs(diferencia)} días`;
  return `Las siguientes se moverán ${dias} ${diferencia > 0 ? "después" : "antes"}.`;
}

export default function FormularioReprogramar({ mascota, alGuardar, alCancelar }: Props) {
  const [fecha, setFecha] = useState(mascota.fechaCuidado);
  const [motivo, setMotivo] = useState("");
  const [alcance, setAlcance] = useState<AlcanceReprogramacion>("solo_esta");
  const [errorFecha, setErrorFecha] = useState<string>();
  const [errorMotivo, setErrorMotivo] = useState<string>();
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);
  const esRecurrente = mascota.proximasFechas.length > 0;

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral("");

    const errorDeFecha =
      validarNuevaFecha(fecha) ??
      (fecha === mascota.fechaCuidado ? "Elige una fecha distinta a la actual" : undefined);
    const errorDeMotivo = validarMotivo(motivo);
    setErrorFecha(errorDeFecha);
    setErrorMotivo(errorDeMotivo);
    if (errorDeFecha || errorDeMotivo) return;

    setCargando(true);
    try {
      await reprogramarCuidado(mascota.id, fecha, motivo.trim(), alcance);
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
      <CampoTexto
        id="motivo"
        etiqueta="Motivo"
        valor={motivo}
        alCambiar={setMotivo}
        error={errorMotivo}
        ayuda="Por qué cambia la fecha. Queda guardado en el historial."
      />
      {esRecurrente && (
        <div className="flex flex-col gap-2">
          <GrupoChips
            etiqueta="¿Qué fechas quieres mover?"
            opciones={OPCIONES_ALCANCE}
            valor={alcance}
            alElegir={setAlcance}
          />
          <p className="text-sm text-grisazulado">{textoSiguientes(mascota, fecha, alcance)}</p>
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Boton texto="Cancelar" variante="secundario" alClic={alCancelar} deshabilitado={cargando} />
        <Boton texto="Guardar fecha" textoCargando="Guardando..." cargando={cargando} />
      </div>
    </form>
  );
}
