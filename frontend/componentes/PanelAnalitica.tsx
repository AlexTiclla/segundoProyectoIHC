"use client";

import { useEffect, useState } from "react";

import { ErrorApi, obtenerResumenAnalitica, type ResumenAnalitica } from "@/lib/api";
import MensajeError from "./MensajeError";

export default function PanelAnalitica() {
  const [resumen, setResumen] = useState<ResumenAnalitica | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerResumenAnalitica()
      .then(setResumen)
      .catch((e) => {
        setError(e instanceof ErrorApi ? e.message : "No se pudo cargar la analítica.");
      })
      .finally(() => setCargando(false));
  }, []);

  return (
    <section className="flex w-full flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Analítica de cuidados</h1>
        <p className="text-sm text-grisazulado">
          Cuántos cuidados se registran y cuántos terminan marcados como realizados.
        </p>
      </div>

      <MensajeError mensaje={error} />

      {cargando && <p className="rounded-xl border border-arena bg-white p-6">Cargando analítica...</p>}

      {!cargando && !error && resumen && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-arena bg-white p-6">
            <p className="text-sm font-semibold text-grisazulado">cuidado_abierto</p>
            <p className="text-4xl font-bold text-tinta">{resumen.iniciados}</p>
            <p className="text-sm text-grisazulado">cuidados creados</p>
          </div>
          <div className="rounded-xl border border-arena bg-white p-6">
            <p className="text-sm font-semibold text-grisazulado">cuidado_completado</p>
            <p className="text-4xl font-bold text-tinta">{resumen.completados}</p>
            <p className="text-sm text-grisazulado">marcados como realizados</p>
          </div>
          <div className="rounded-xl border border-arena bg-menta-claro p-6">
            <p className="text-sm font-semibold text-menta-profundo">% que termina</p>
            <p className="text-4xl font-bold text-menta-profundo">{resumen.porcentaje}%</p>
            <p className="text-sm text-menta-profundo">de los cuidados creados se completan</p>
          </div>
        </div>
      )}
    </section>
  );
}
