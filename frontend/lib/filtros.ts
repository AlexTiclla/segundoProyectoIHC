import type { FiltroCuidado } from "@/lib/api";
import { formatearFecha } from "@/componentes/TarjetaMascota";
export type Periodo = "todos" | "proximos7" | "mes" | "rango";

export type FiltrosPantalla = {
  nombre: string;
  estado: "pendiente" | "realizado"| "";
  tipoCuidado: string;
  periodo: Periodo;
  desde: string;
  hasta: string;
};

export type ClaveFiltro ="nombre" | "estado" | "tipoCuidado" | "fecha";
export type FiltroActivo = { clave: ClaveFiltro; texto: string };
export const FILTROS_VACIOS: FiltrosPantalla = {
     nombre: "",
     estado: "",
     tipoCuidado: "",
     periodo: "todos",
     desde: "",
     hasta: "",
};

// Al entrar a la pantalla se muestran solo los cuidados pendientes,
// en vez de todos, para que lo primero que se vea sea lo que falta hacer.
export const FILTROS_INICIALES: FiltrosPantalla = {
     ...FILTROS_VACIOS,
     estado: "pendiente",
};

function formatear(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

type Rango = { fechaDesde?: string; fechaHasta?: string };
 
export function calcularRango(filtros: FiltrosPantalla, hoy: Date = new Date()): Rango {
  if (filtros.periodo === "proximos7") {
    const limite = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 7);
    return { fechaDesde: formatear(hoy), fechaHasta: formatear(limite) };
  }
  if (filtros.periodo === "mes") {
    const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    return { fechaDesde: formatear(primero), fechaHasta: formatear(ultimo) };
  }
  if (filtros.periodo === "rango") {
    return {
      fechaDesde: filtros.desde || undefined,
      fechaHasta: filtros.hasta || undefined,
    };
  }
  return {};
}
 
export function validarRango(filtros: FiltrosPantalla): string | undefined {
  if (filtros.periodo !== "rango") return undefined;
  if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
    return "La fecha inicial no puede ser posterior a la fecha final";
  }
  return undefined;
}
 
export function aParametros(filtros: FiltrosPantalla, hoy: Date = new Date()): FiltroCuidado {
  return {
    nombre: filtros.nombre,
    estado: filtros.estado|| undefined,
    tipoCuidado: filtros.tipoCuidado,
    ...calcularRango(filtros, hoy),
  };
}
 
function textoFecha(filtros: FiltrosPantalla): string | undefined {
  if(filtros.periodo === "proximos7"){
    return "Próximos 7 días";
  }
  if(filtros.periodo === "mes"){
    return "Este mes";
  }
  if(filtros.periodo === "rango") {
    if(filtros.desde && filtros.hasta){
        return `Del ${formatearFecha(filtros.desde)} al ${formatearFecha(filtros.hasta)}`;
    }
    if(filtros.desde){
        return `Desde el ${formatearFecha(filtros.desde)}`;
    }
    if(filtros.hasta){
        return `Hasta el ${formatearFecha(filtros.hasta)}`;
    }
  }
  return undefined;
}
 
export function filtrosActivos(filtros: FiltrosPantalla): FiltroActivo[] {
  const activos: FiltroActivo[] = [];
  if (filtros.nombre.trim()) {
    activos.push({ clave: "nombre", texto: `Nombre: ${filtros.nombre.trim()}` });
  }
  if (filtros.estado) {
    activos.push({
      clave: "estado",
      texto: `Estado: ${filtros.estado === "pendiente" ? "Pendiente" : "Realizado"}`,
    });
  }
  if (filtros.tipoCuidado.trim()) {
    activos.push({ clave: "tipoCuidado", texto: `Cuidado: ${filtros.tipoCuidado.trim()}` });
  }
  const fecha = textoFecha(filtros);
  if (fecha) activos.push({ clave: "fecha", texto: fecha });
  return activos;
}
 
export function quitarFiltro(filtros: FiltrosPantalla, clave: ClaveFiltro): FiltrosPantalla {
  if (clave === "nombre") return { ...filtros, nombre: "" };
  if (clave === "estado") return { ...filtros, estado: "" };
  if (clave === "tipoCuidado") return { ...filtros, tipoCuidado: "" };
  return { ...filtros, periodo: "todos", desde: "", hasta: "" };
}