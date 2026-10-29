import type { Mascota } from "@/lib/api";
import { fechaHoy } from "@/lib/validaciones";
import MenuAcciones, { type OpcionMenu } from "./MenuAcciones";

type Props = {
  mascota: Mascota;
  alEditar: (mascota: Mascota) => void;
  alEliminar: (mascota: Mascota) => void;
  alRealizar: (mascota: Mascota) => void;
  alReprogramar: (mascota: Mascota) => void;
  alAsignar: (mascota: Mascota) => void;
};

export function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Días que faltan (positivo) o que pasaron (negativo) respecto a hoy.
// Se usa Date.UTC para que el cambio de horario no altere el conteo.
function diasHasta(fecha: string): number {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const [anioHoy, mesHoy, diaHoy] = fechaHoy().split("-").map(Number);
  const msPorDia = 24 * 60 * 60 * 1000;
  return Math.round(
    (Date.UTC(anio, mes - 1, dia) - Date.UTC(anioHoy, mesHoy - 1, diaHoy)) / msPorDia
  );
}

function textoDias(dias: number): string {
  if (dias === 0) return "hoy";
  if (dias === 1) return "mañana";
  if (dias === -1) return "ayer";
  if (dias > 1) return `en ${dias} días`;
  return `hace ${Math.abs(dias)} días`;
}

export default function TarjetaMascota({
  mascota,
  alEditar,
  alEliminar,
  alRealizar,
  alReprogramar,
  alAsignar
}: Props) {
  const realizado = mascota.estado === "realizado";
  const dias = diasHasta(mascota.fechaCuidado);
  const atrasado = !realizado && dias < 0;

  // Acciones poco frecuentes: van dentro del menú de tres puntos
  const opcionesMenu: OpcionMenu[] = [
    ...(!realizado ? [{ texto: "Editar", alSeleccionar: () => alEditar(mascota) }] : []),
    { texto: "Eliminar", alSeleccionar: () => alEliminar(mascota), peligrosa: true },
  ];

  return (
    <article
      className={`flex flex-col gap-2 rounded-xl border ${atrasado ? "border-red-300" : "border-arena"} ${realizado ? "bg-neutral-50" : "bg-white"} p-4 text-left text-neutral-900 shadow-sm`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-xl font-bold">{mascota.nombre}</h3>
          <p className="text-sm text-grisazulado">
            {mascota.especie} · {mascota.sexo}
          </p>
        </div>
        <MenuAcciones
          etiqueta={`Más acciones de ${mascota.cuidado} de ${mascota.nombre}`}
          opciones={opcionesMenu}
        />
      </div>

      <p>
        <span className="font-semibold">{mascota.cuidado}</span> el{" "}
        {formatearFecha(mascota.fechaCuidado)}
      </p>
      <p>
        <span className="font-semibold">Estado:</span>{" "}
        {realizado ? (
          "Realizado"
        ) : atrasado ? (
          <span className="font-semibold text-red-700">
            Atrasado ({textoDias(dias)}): reprograma o márcalo como realizado
          </span>
        ) : (
          <>Pendiente ({textoDias(dias)})</>
        )}
      </p>
      {realizado && (
        <p className="text-sm text-grisazulado">
          Este cuidado ya fue realizado, por eso no se puede reprogramar ni editar.
        </p>
      )}
      {/* Responsable del cuidado */}
      <p>
        <strong>Responsable:</strong>{" "}
        {mascota.responsableNombre || "Sin asignar"}
      </p>

      {!realizado && (
        <button
          type="button"
          onClick={() => alAsignar(mascota)}
          className="min-h-11 w-full rounded-lg border border-arena px-4 py-2 font-semibold text-tinta hover:bg-menta-claro"
        >
          Asignar responsable
        </button>
      )}
      {!realizado && (
        <div className="mt-2 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => alRealizar(mascota)}
            className="min-h-11 w-full rounded-lg bg-menta-oscuro px-4 py-2 font-semibold text-white hover:bg-menta-profundo"
          >
            Marcar como realizado
          </button>
          <button
            type="button"
            onClick={() => alReprogramar(mascota)}
            className="min-h-11 w-full rounded-lg border border-arena px-4 py-2 font-semibold text-tinta hover:bg-menta-claro"
          >
            Reprogramar
          </button>
        </div>
      )}
    </article>
  );
}