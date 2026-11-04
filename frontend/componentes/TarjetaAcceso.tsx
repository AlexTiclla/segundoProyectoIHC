import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  titulo: string;
  children: ReactNode;
};

// Marco común de las pantallas de ingreso, registro y recuperación
export default function TarjetaAcceso({ titulo, children }: Props) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 p-4 sm:p-6">
      <Link href="/" className="self-center text-lg font-bold text-menta-profundo">
        Mascota al Día
      </Link>
      <div className="flex flex-col gap-6 rounded-2xl border border-arena bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">{titulo}</h1>
        {children}
      </div>
    </main>
  );
}
