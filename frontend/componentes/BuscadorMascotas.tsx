"use client";

import { filtrosActivos, type FiltrosPantalla } from "@/lib/filtros";
import GrupoChips from "./GrupoChips";

type Props = {
  filtros: FiltrosPantalla;
  alCambiar: (filtros: FiltrosPantalla) => void;
  mostrarFiltros: boolean;
  alAlternarFiltros: () => void;
  idPanelFiltros: string;
  clase?: string;
};

const OPCIONES_ESTADO: { valor: FiltrosPantalla["estado"]; texto: string }[] = [
  { valor: "", texto: "Todos" },
  { valor: "pendiente", texto: "Pendientes" },
  { valor: "realizado", texto: "Realizados" },
];

export default function BuscadorMascotas({
  filtros,
  alCambiar,
  mostrarFiltros,
  alAlternarFiltros,
  idPanelFiltros,
  clase = "",
}: Props) {
  // El botón solo cuenta los filtros que están dentro del panel
  const cantidadEnPanel = filtrosActivos(filtros).filter(
    (filtro) => filtro.clave === "tipoCuidado" || filtro.clave === "fecha"
  ).length;

  return (
    <div className={`flex flex-col gap-3 ${clase}`}>
      <div className="flex items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor="filtro-nombre" className="text-sm font-semibold">
            Buscar mascota
          </label>
          <input
            id="filtro-nombre"
            type="search"
            value={filtros.nombre}
            onChange={(e) => alCambiar({ ...filtros, nombre: e.target.value })}
            placeholder="Escribe un nombre..."
            className="min-h-11 w-full rounded-lg border border-contorno bg-white px-3 py-2 text-tinta"
          />
        </div>

        {/* En pantallas grandes los filtros siempre están visibles */}
        <button
          type="button"
          aria-expanded={mostrarFiltros}
          aria-controls={idPanelFiltros}
          onClick={alAlternarFiltros}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-contorno bg-white px-3 py-2 font-semibold hover:bg-menta-claro lg:hidden"
        >
          Filtros{cantidadEnPanel > 0 && ` (${cantidadEnPanel})`}
          <span aria-hidden="true">{mostrarFiltros ? "▲" : "▼"}</span>
        </button>
      </div>

      <GrupoChips
        etiqueta="Estado"
        opciones={OPCIONES_ESTADO}
        valor={filtros.estado}
        alElegir={(estado) => alCambiar({ ...filtros, estado })}
      />
    </div>
  );
}
