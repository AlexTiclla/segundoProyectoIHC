"use client";

import { CUIDADOS } from "@/lib/constantes";
import type { FiltrosPantalla, Periodo } from "@/lib/filtros";
import CampoTexto from "./CampoTexto";
import GrupoChips from "./GrupoChips";
import MensajeError from "./MensajeError";

type Props = {
  id: string;
  filtros: FiltrosPantalla;
  alCambiar: (filtros: FiltrosPantalla) => void;
  errorRango?: string;
  mostrar: boolean;
  clase?: string;
};

const OPCIONES_CUIDADO = [
  { valor: "", texto: "Todos" },
  ...CUIDADOS.map((cuidado) => ({ valor: cuidado, texto: cuidado })),
];

const OPCIONES_PERIODO: { valor: Periodo; texto: string }[] = [
  { valor: "todos", texto: "Todas" },
  { valor: "proximos7", texto: "Próximos 7 días" },
  { valor: "mes", texto: "Este mes" },
  { valor: "rango", texto: "Elegir fechas" },
];

export default function FiltrosMascotas({ id, filtros, alCambiar, errorRango, mostrar, clase = "" }: Props) {
  return (
    <section
      id={id}
      aria-label="Filtros de cuidados"
      className={`${mostrar ? "flex" : "hidden"} flex-col gap-6 rounded-xl border border-arena bg-white p-4 lg:flex ${clase}`}
    >
      <GrupoChips
        etiqueta="Tipo de cuidado"
        ayuda="Elige uno para ver solo ese cuidado."
        opciones={OPCIONES_CUIDADO}
        valor={filtros.tipoCuidado}
        alElegir={(tipoCuidado) => alCambiar({ ...filtros, tipoCuidado })}
      />

      <GrupoChips
        etiqueta="Fecha"
        opciones={OPCIONES_PERIODO}
        valor={filtros.periodo}
        alElegir={(periodo) => alCambiar({ ...filtros, periodo })}
      />

      {filtros.periodo === "rango" && (
        <div className="flex flex-col gap-3">
          <CampoTexto
            id="filtro-desde"
            etiqueta="Desde"
            tipo="date"
            valor={filtros.desde}
            alCambiar={(desde) => alCambiar({ ...filtros, desde })}
          />
          <CampoTexto
            id="filtro-hasta"
            etiqueta="Hasta"
            tipo="date"
            valor={filtros.hasta}
            alCambiar={(hasta) => alCambiar({ ...filtros, hasta })}
          />
          <MensajeError mensaje={errorRango} />
        </div>
      )}
    </section>
  );
}
