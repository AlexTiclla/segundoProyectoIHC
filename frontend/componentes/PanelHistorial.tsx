"use client";

import { useEffect, useState } from "react";

import { ErrorApi, listarHistorial, type RegistroHistorial } from "@/lib/api";
import MensajeError from "./MensajeError";

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fecha));
}

const etiquetas: Record<string, string> = {
  crear: "Creación",
  actualizar: "Actualización",
  eliminar: "Eliminación",
  reprogramar: "Reprogramación",
  realizar: "Cuidado realizado",
  responsable: "Responsable asignado",
};

export default function PanelHistorial() {
  const [registros, setRegistros] = useState<RegistroHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listarHistorial()
      .then((datos) => setRegistros(datos))
      .catch((e) => {
        setError(e instanceof ErrorApi ? e.message : "No se pudo cargar el historial.");
      })
      .finally(() => setCargando(false));
  }, []);

  return (
    <section className="flex w-full flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Historial de acciones</h1>
        <p className="text-sm text-grisazulado">Lo último que hiciste aparece primero.</p>
      </div>

      <MensajeError mensaje={error} />

      {cargando && <p className="rounded-xl border border-arena bg-white p-6">Cargando historial...</p>}

      {!cargando && !error && registros.length === 0 && (
        <p className="rounded-xl border border-arena bg-white p-6 text-grisazulado">
          Todavía no hay acciones registradas.
        </p>
      )}

      {!cargando && !error && registros.length > 0 && (
        <ol className="flex flex-col gap-3 text-left">
          {registros.map((registro) => (
            <li key={registro.id} className="rounded-xl border border-arena bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-menta-profundo">
                  {etiquetas[registro.tipoAccion] ?? registro.tipoAccion}
                </span>
                <time className="text-sm text-grisazulado">
                  {formatearFecha(registro.fechaRegistro)}
                </time>
              </div>
              <p className="mt-2 text-tinta">{registro.descripcion}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
