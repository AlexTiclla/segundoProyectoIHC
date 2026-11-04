"use client";

import { useEffect, useId, useRef, useState } from "react";

export type OpcionMenu = {
  texto: string;
  alSeleccionar: () => void;
  peligrosa?: boolean;
};

type Props = {
  etiqueta: string;
  opciones: OpcionMenu[];
};

export default function MenuAcciones({ etiqueta, opciones }: Props) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const idMenu = useId();

  // Mientras el menú está abierto: se cierra al tocar fuera o con Escape
  useEffect(() => {
    if (!abierto) return;

    function alTocarFuera(evento: PointerEvent) {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    }

    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAbierto(false);
        boton.current?.focus();
      }
    }

    document.addEventListener("pointerdown", alTocarFuera);
    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("pointerdown", alTocarFuera);
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [abierto]);

  return (
    <div ref={contenedor} className="relative shrink-0">
      <button
        ref={boton}
        type="button"
        aria-label={etiqueta}
        aria-expanded={abierto}
        aria-controls={idMenu}
        onClick={() => setAbierto((valor) => !valor)}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-tinta hover:bg-menta-claro"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <circle cx="4" cy="10" r="1.75" />
          <circle cx="10" cy="10" r="1.75" />
          <circle cx="16" cy="10" r="1.75" />
        </svg>
      </button>

      {abierto && (
        <div
          id={idMenu}
          className="absolute right-0 top-12 z-10 min-w-44 overflow-hidden rounded-lg border border-arena bg-white shadow-lg"
        >
          {opciones.map((opcion, indice) => (
            <button
              key={opcion.texto}
              type="button"
              onClick={() => {
                setAbierto(false);
                boton.current?.focus(); // la opción desaparece: el foco vuelve al botón del menú
                opcion.alSeleccionar();
              }}
              className={`flex min-h-11 w-full items-center whitespace-nowrap px-4 text-left font-semibold ${
                opcion.peligrosa
                  ? `${indice > 0 ? "border-t border-arena " : ""}text-red-700 hover:bg-red-50`
                  : "text-tinta hover:bg-menta-claro"
              }`}
            >
              {opcion.texto}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}