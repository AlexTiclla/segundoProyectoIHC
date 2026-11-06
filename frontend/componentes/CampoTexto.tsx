"use client";

import { useState } from "react";

type Props = {
  id: string;
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
  tipo?: "text" | "email" | "password" | "date" | "number";
  error?: string;
  ayuda?: string;
  autoComplete?: string;
  deshabilitado?: boolean;
  min?: string;
};

export default function CampoTexto({
  id,
  etiqueta,
  valor,
  alCambiar,
  tipo = "text",
  error,
  ayuda,
  autoComplete,
  deshabilitado = false,
  min,
}: Props) {
  const [visible, setVisible] = useState(false);
  const esContrasena = tipo === "password";
  const tipoReal = esContrasena && visible ? "text" : tipo;

  let idDescripcion: string | undefined;
  if (error) idDescripcion = `${id}-error`;
  else if (ayuda) idDescripcion = `${id}-ayuda`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-medium">
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={id}
          type={tipoReal}
          value={valor}
          min={min}
          onChange={(evento) => alCambiar(evento.target.value)}
          autoComplete={autoComplete}
          disabled={deshabilitado}
          aria-invalid={error ? true : undefined}
          aria-describedby={idDescripcion}
          className={`min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-tinta disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-600 ${
            error ? "border-red-600" : "border-contorno"
          } ${esContrasena ? "pr-20" : ""}`}
        />
        {esContrasena && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-1 top-1/2 min-h-9 -translate-y-1/2 rounded px-2 text-sm font-medium text-menta-profundo"
          >
            {visible ? "Ocultar" : "Mostrar"}
          </button>
        )}
      </div>
      {ayuda && !error && (
        <p id={`${id}-ayuda`} className="text-sm text-grisazulado">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
