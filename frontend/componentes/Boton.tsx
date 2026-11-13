import Link from "next/link";

type Props = {
  texto: string;
  textoCargando?: string;
  cargando?: boolean;
  deshabilitado?: boolean;
  href?: string;
  // Para un enlace que descarga un archivo: usa <a download>, no la navegación de Next.
  descargar?: boolean;
  variante?: "primario" | "secundario" | "texto" | "peligro";
  alClic?: () => void;
  clase?: string;
};

const estilos = {
  primario: "bg-menta-oscuro text-white hover:bg-menta-profundo",
  secundario: "border border-contorno bg-white text-tinta hover:bg-menta-claro",
  texto: "text-menta-profundo underline hover:bg-menta-claro",
  peligro: "bg-red-700 text-white hover:bg-red-800",
};

export default function Boton({
  texto,
  textoCargando,
  cargando = false,
  deshabilitado = false,
  href,
  descargar = false,
  variante = "primario",
  alClic,
  clase = "",
}: Props) {
  const clases = `inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-center font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${estilos[variante]} ${clase}`;

  if (href && descargar) {
    return (
      <a href={href} download className={clases}>
        {texto}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} className={clases}>
        {texto}
      </Link>
    );
  }

  return (
    <button
      type={alClic ? "button" : "submit"}
      onClick={alClic}
      disabled={cargando || deshabilitado}
      className={clases}
    >
      {cargando ? (textoCargando ?? texto) : texto}
    </button>
  );
}
