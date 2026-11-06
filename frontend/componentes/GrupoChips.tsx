import { useId } from "react";

import Chip from "./Chip";

type Props<T extends string> = {
  etiqueta: string;
  ayuda?: string;
  opciones: { valor: T; texto: string }[];
  valor: T;
  alElegir: (valor: T) => void;
};

// Un grupo de chips donde se elige una sola opción
export default function GrupoChips<T extends string>({
  etiqueta,
  ayuda,
  opciones,
  valor,
  alElegir,
}: Props<T>) {
  const idEtiqueta = useId();

  return (
    <div className="flex flex-col gap-2">
      <div>
        <span id={idEtiqueta} className="text-sm font-semibold">
          {etiqueta}
        </span>
        {ayuda && <p className="text-sm text-grisazulado">{ayuda}</p>}
      </div>
      <div role="group" aria-labelledby={idEtiqueta} className="flex flex-wrap gap-2">
        {opciones.map((opcion) => (
          <Chip
            key={opcion.valor || "todos"}
            texto={opcion.texto}
            seleccionado={valor === opcion.valor}
            alClic={() => alElegir(opcion.valor)}
          />
        ))}
      </div>
    </div>
  );
}
