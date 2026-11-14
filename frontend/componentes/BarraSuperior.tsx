import Link from "next/link";

import BotonSalir from "./BotonSalir";

type Props = {
  nombreUsuario: string;
  actual: "mascotas" | "historial" | "compartir" | "analitica" | "cuenta";
};

const enlaces = [
  { clave: "mascotas", texto: "Mascotas", href: "/inicio" },
  { clave: "historial", texto: "Historial", href: "/historial" },
  { clave: "compartir", texto: "Compartir", href: "/compartir" },
  { clave: "analitica", texto: "Analítica", href: "/analitica" },
  { clave: "cuenta", texto: "Mi cuenta", href: "/cuenta" },
];

export default function BarraSuperior({ nombreUsuario, actual }: Props) {
  return (
    <header className="border-b border-arena bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/inicio" className="text-lg font-bold text-menta-profundo">
          Mascota al Día
        </Link>

        <nav aria-label="Principal" className="order-last flex w-full gap-2 sm:order-none sm:w-auto sm:flex-1">
          {enlaces.map((enlace) => {
            const esActual = enlace.clave === actual;
            return (
              <Link
                key={enlace.clave}
                href={enlace.href}
                aria-current={esActual ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-lg px-3 font-semibold hover:bg-menta-claro ${
                  esActual ? "bg-menta-claro text-menta-profundo" : "text-tinta"
                }`}
              >
                {enlace.texto}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-grisazulado md:inline">{nombreUsuario}</span>
          <BotonSalir />
        </div>
      </div>
    </header>
  );
}
