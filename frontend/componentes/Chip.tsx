type Props = {
  texto: string;
  seleccionado: boolean;
  alClic: () => void;
};

export default function Chip({ texto, seleccionado, alClic }: Props) {
  return (
    <button
      type="button"
      aria-pressed={seleccionado}
      onClick={alClic}
      className={`flex min-h-11 items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
        seleccionado
          ? "border-menta-oscuro bg-menta-oscuro text-white"
          : "border-contorno bg-white text-tinta hover:bg-menta-claro"
      }`}
    >
      {seleccionado && <span aria-hidden="true">✓</span>}
      {texto}
    </button>
  );
}
