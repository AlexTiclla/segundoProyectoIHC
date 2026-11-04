import { fechaHoy } from "@/lib/validaciones";

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
export function diasHasta(fecha: string): number {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const [anioHoy, mesHoy, diaHoy] = fechaHoy().split("-").map(Number);
  const msPorDia = 24 * 60 * 60 * 1000;
  return Math.round(
    (Date.UTC(anio, mes - 1, dia) - Date.UTC(anioHoy, mesHoy - 1, diaHoy)) / msPorDia
  );
}

export function textoDias(dias: number): string {
  if (dias === 0) return "hoy";
  if (dias === 1) return "mañana";
  if (dias === -1) return "ayer";
  if (dias > 1) return `en ${dias} días`;
  return `hace ${Math.abs(dias)} días`;
}
