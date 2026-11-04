"use client";

import {
  FILTROS_VACIOS,
  filtrosActivos,
  quitarFiltro,
  type FiltrosPantalla,
} from "@/lib/filtros";
import Boton from "./Boton";

type Props = {
  cantidad: number;
  cargando: boolean;
  filtros: FiltrosPantalla;
  alCambiar: (filtros: FiltrosPantalla) => void;
};

// Dice cuántos resultados hay y qué filtros los están limitando
export default function ResumenFiltros({ cantidad, cargando, filtros, alCambiar }: Props) {
  const activos = filtrosActivos(filtros);

  let textoCantidad = `${cantidad} cuidados`;
  if (cargando) textoCantidad = "Buscando...";
  else if (cantidad === 1) textoCantidad = "1 cuidado";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p role="status" className="mr-2 font-semibold">
        {textoCantidad}
      </p>

      {activos.length > 0 && (
        <>
          <ul aria-label="Filtros activos" className="contents">
            {activos.map((filtro) => (
              <li key={filtro.clave} className="min-w-0">
                <button
                  type="button"
                  onClick={() => alCambiar(quitarFiltro(filtros, filtro.clave))}
                  aria-label={`Quitar filtro ${filtro.texto}`}
                  className="flex min-h-11 max-w-full items-center gap-2 rounded-lg bg-menta-claro px-3 py-2 text-left text-sm font-medium hover:bg-menta"
                >
                  <span className="min-w-0 break-words">{filtro.texto}</span>
                  <span aria-hidden="true">✕</span>
                </button>
              </li>
            ))}
          </ul>
          <Boton texto="Limpiar todo" variante="texto" alClic={() => alCambiar(FILTROS_VACIOS)} />
        </>
      )}
    </div>
  );
}
