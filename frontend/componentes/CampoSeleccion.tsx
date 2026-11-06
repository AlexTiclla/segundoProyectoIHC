"use client";

import { useState } from "react";

import CampoTexto from "./CampoTexto";

type Props = {
  id: string;
  etiqueta: string;
  opciones: string[];
  valor: string;
  alCambiar: (valor: string) => void;
  error?: string;
  ayuda?: string;
  textoOtro?: string; // Si se indica, permite escribir un valor que no está en la lista
};

const OTRO = "__otro__";

export default function CampoSeleccion({
  id,
  etiqueta,
  opciones,
  valor,
  alCambiar,
  error,
  ayuda,
  textoOtro,
}: Props) {
  const coincidencia = opciones.find(
    (opcion) => opcion.toLowerCase() === valor.trim().toLowerCase()
  );
  // Al editar, un valor que no está en la lista se muestra en el campo de texto
  const [escribiendo, setEscribiendo] = useState(Boolean(valor) && !coincidencia);

  function alElegir(elegido: string) {
    const esOtro = elegido === OTRO;
    setEscribiendo(esOtro);
    alCambiar(esOtro ? "" : elegido);
  }

  const errorSelect = escribiendo ? undefined : error;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="font-medium">
          {etiqueta}
        </label>
        <select
          id={id}
          value={escribiendo ? OTRO : (coincidencia ?? "")}
          onChange={(evento) => alElegir(evento.target.value)}
          aria-invalid={errorSelect ? true : undefined}
          aria-describedby={errorSelect ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined}
          className={`min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-tinta ${
            errorSelect ? "border-red-600" : "border-contorno"
          }`}
        >
          {!coincidencia && !escribiendo && <option value="">Elige una opción</option>}
          {opciones.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
          {textoOtro && <option value={OTRO}>{textoOtro}</option>}
        </select>
        {ayuda && !errorSelect && (
          <p id={`${id}-ayuda`} className="text-sm text-grisazulado">
            {ayuda}
          </p>
        )}
        {errorSelect && (
          <p id={`${id}-error`} className="text-sm text-red-700">
            {errorSelect}
          </p>
        )}
      </div>

      {escribiendo && (
        <CampoTexto
          id={`${id}-otro`}
          etiqueta={`${etiqueta}: escribe cuál`}
          valor={valor}
          alCambiar={alCambiar}
          error={error}
        />
      )}
    </div>
  );
}
