"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type Props = {
  titulo: string;
  alCerrar: () => void;
  children: ReactNode;
};

// Ventana sobre la pantalla. El <dialog> nativo ya mantiene el foco adentro
// y se cierra con Escape.
export default function Dialogo({ titulo, alCerrar, children }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);
  const idTitulo = useId();

  useEffect(() => {
    if (dialogo.current && !dialogo.current.open) {
      focoAnterior.current = document.activeElement as HTMLElement;
      dialogo.current.showModal();
    }
    // Al cerrarse, el foco vuelve al botón que abrió la ventana
    return () => focoAnterior.current?.focus();
  }, []);

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={idTitulo}
      onClose={alCerrar}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl bg-white p-6 text-tinta shadow-xl backdrop:bg-black/40"
    >
      <h2 id={idTitulo} className="mb-4 text-xl font-bold">
        {titulo}
      </h2>
      {children}
    </dialog>
  );
}
