"use client";

import { useState, type FormEvent } from "react";
import { ErrorApi, omitirCuidado, type Mascota } from "@/lib/api";
import Boton from "./Boton";

type Props = {
  mascota: Mascota;
  alGuardar: (mensaje: string) => void;
  alCancelar: () => void;
};

export default function FormularioOmitir({
  mascota,
  alGuardar,
  alCancelar,
}: Props) {
  const [motivo, setMotivo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!motivo.trim()) {
      setError("Debes indicar el motivo de la omisión.");
      return;
    }

    setCargando(true);
    setError("");

    try {
      await omitirCuidado(mascota.id, motivo.trim());
      alGuardar(`Se omitió el cuidado de ${mascota.nombre}`);
    } catch (e) {
      setError(
        e instanceof ErrorApi ? e.message : "No se pudo omitir el cuidado.",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4">
      <p>
        Indica por qué no se realizó el cuidado
        <strong> {mascota.cuidado}</strong>.
      </p>

      <label htmlFor="motivo-omision" className="font-semibold">
        Motivo de omisión
      </label>

      <textarea
        id="motivo-omision"
        required
        maxLength={200}
        rows={4}
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        className="w-full rounded-lg border border-contorno p-3"
        placeholder="Ej.: No fue posible asistir a la cita"
      />

      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Boton
          texto="Cancelar"
          variante="secundario"
          alClic={alCancelar}
          deshabilitado={cargando}
        />

        <Boton
          texto="Confirmar omisión"
          textoCargando="Guardando..."
          cargando={cargando}
        />
      </div>
    </form>
  );
}
