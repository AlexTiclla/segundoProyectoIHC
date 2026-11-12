export type Usuario = {
  id: number;
  nombreCompleto: string;
  correo: string;
};

type UsuarioRespuesta = {
  id: number;
  nombre_completo: string;
  correo: string;
};

export class ErrorApi extends Error {
  estado: number;

  constructor(mensaje: string, estado: number) {
    super(mensaje);
    this.estado = estado;
  }
}

type Opciones = {
  metodo?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  cuerpo?: unknown;
};

async function pedir<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: opciones.metodo ?? "GET",
      headers: opciones.cuerpo
        ? { "Content-Type": "application/json" }
        : undefined,
      body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi(
      "No se pudo conectar con el servidor. Intenta de nuevo.",
      0,
    );
  }

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    if (
      respuesta.status === 401 &&
      !ruta.startsWith("/auth/") &&
      typeof window !== "undefined"
    ) {
      window.location.assign("/ingresar?sesion=vencida");
      throw new ErrorApi("Tu sesión venció. Vuelve a ingresar.", 401);
    }
    const mensaje =
      typeof datos?.detail === "string"
        ? datos.detail
        : "Revisa los datos ingresados e intenta de nuevo.";
    throw new ErrorApi(mensaje, respuesta.status);
  }

  return datos as T;
}

function convertirUsuario(datos: UsuarioRespuesta): Usuario {
  return {
    id: datos.id,
    nombreCompleto: datos.nombre_completo,
    correo: datos.correo,
  };
}

export async function registrar(
  nombreCompleto: string,
  correo: string,
  contrasena: string,
) {
  const datos = await pedir<UsuarioRespuesta>("/auth/registro", {
    metodo: "POST",
    cuerpo: { nombre_completo: nombreCompleto, correo, contrasena },
  });
  return convertirUsuario(datos);
}

export async function ingresar(correo: string, contrasena: string) {
  const datos = await pedir<UsuarioRespuesta>("/auth/ingresar", {
    metodo: "POST",
    cuerpo: { correo, contrasena },
  });
  return convertirUsuario(datos);
}

export async function salir() {
  await pedir<{ mensaje: string }>("/auth/salir", { metodo: "POST" });
}

export async function solicitarRecuperacion(correo: string) {
  return pedir<{ mensaje: string; codigo: string | null }>("/auth/recuperar", {
    metodo: "POST",
    cuerpo: { correo },
  });
}

export async function cambiarContrasena(
  correo: string,
  codigo: string,
  contrasenaNueva: string,
) {
  return pedir<{ mensaje: string }>("/auth/cambiar-contrasena", {
    metodo: "POST",
    cuerpo: { correo, codigo, contrasena_nueva: contrasenaNueva },
  });
}

export type AlcanceReprogramacion = "solo_esta" | "futuras";

export type Reprogramacion = {
  fechaAnterior: string;
  fechaNueva: string;
  diferenciaDias: number;
  motivo: string;
  alcance: string;
};

// Lo que el usuario puede hacer con un cuidado: el propio, o el de otra cuenta que lo comparte
export type Permiso = "propietario" | "consulta" | "gestion";

export type Mascota = {
  id: number;
  nombre: string;
  sexo: string;
  especie: string;
  cuidado: string;
  fechaCuidado: string;
  estado: string;
  responsableNombre: string | null;
  propietarioNombre: string;
  permiso: Permiso;
  realizadoPorNombre: string | null;
  realizadoEn: string | null;
  intervaloCantidad: number | null;
  intervaloUnidad: string | null;
  proximaFecha: string | null;
  proximasFechas: string[];
  fechaOriginal: string;
  reprogramaciones: Reprogramacion[];
  vencido: boolean;
  motivoOmision: string | null;
};

export type DatosMascota = Omit<
  Mascota,
  | "id"
  | "estado"
  | "vencido"
  | "motivoOmision"
  | "responsableNombre"
  | "propietarioNombre"
  | "permiso"
  | "realizadoPorNombre"
  | "realizadoEn"
  | "proximaFecha"
  | "proximasFechas"
  | "fechaOriginal"
  | "reprogramaciones"
>;

type MascotaRespuesta = {
  id: number;
  nombre: string;
  sexo: string;
  especie: string;
  cuidado: string;
  fecha_cuidado: string;
  estado: string;
  usuario_id: number;
  responsable_nombre: string | null;
  propietario_nombre: string;
  permiso: Permiso;
  realizado_por_nombre: string | null;
  realizado_en: string | null;
  intervalo_cantidad: number | null;
  intervalo_unidad: string | null;
  proxima_fecha: string | null;
  proximas_fechas: string[];
  fecha_original: string;
  reprogramaciones: {
    fecha_anterior: string;
    fecha_nueva: string;
    diferencia_dias: number;
    motivo: string;
    alcance: string;
  }[];
  vencido: boolean;
  motivo_omision: string | null;
};

function convertirMascota(datos: MascotaRespuesta): Mascota {
  return {
    id: datos.id,
    nombre: datos.nombre,
    sexo: datos.sexo,
    especie: datos.especie,
    cuidado: datos.cuidado,
    fechaCuidado: datos.fecha_cuidado,
    estado: datos.estado,
    responsableNombre: datos.responsable_nombre,
    propietarioNombre: datos.propietario_nombre,
    permiso: datos.permiso,
    realizadoPorNombre: datos.realizado_por_nombre,
    realizadoEn: datos.realizado_en,
    intervaloCantidad: datos.intervalo_cantidad,
    intervaloUnidad: datos.intervalo_unidad,
    proximaFecha: datos.proxima_fecha,
    proximasFechas: datos.proximas_fechas,
    fechaOriginal: datos.fecha_original,
    reprogramaciones: datos.reprogramaciones.map((r) => ({
      fechaAnterior: r.fecha_anterior,
      fechaNueva: r.fecha_nueva,
      diferenciaDias: r.diferencia_dias,
      motivo: r.motivo,
      alcance: r.alcance,
    })),
    vencido: datos.vencido,
    motivoOmision: datos.motivo_omision,
  };
}

function cuerpoMascota(datos: DatosMascota) {
  return {
    nombre: datos.nombre,
    sexo: datos.sexo,
    especie: datos.especie,
    cuidado: datos.cuidado,
    fecha_cuidado: datos.fechaCuidado,
    intervalo_cantidad: datos.intervaloCantidad,
    intervalo_unidad: datos.intervaloUnidad,
  };
}

function cuerpoMascotaActualizar(datos: DatosMascota) {
  return {
    nombre: datos.nombre,
    sexo: datos.sexo,
    especie: datos.especie,
    cuidado: datos.cuidado,
    intervalo_cantidad: datos.intervaloCantidad,
    intervalo_unidad: datos.intervaloUnidad,
  };
}

export async function listarMascotas() {
  const datos = await pedir<MascotaRespuesta[]>("/mascotas");
  return datos.map(convertirMascota);
}

export async function crearMascota(datos: DatosMascota) {
  return pedir<MascotaRespuesta>("/mascotas", {
    metodo: "POST",
    cuerpo: cuerpoMascota(datos),
  });
}

export async function actualizarMascota(id: number, datos: DatosMascota) {
  return pedir<MascotaRespuesta>(`/mascotas/${id}`, {
    metodo: "PUT",
    cuerpo: cuerpoMascotaActualizar(datos),
  });
}

export async function eliminarMascota(id: number) {
  return pedir<null>(`/mascotas/${id}`, {
    metodo: "DELETE",
  });
}

export async function marcarRealizado(id: number) {
  const respuesta = await pedir<MascotaRespuesta>(`/mascotas/${id}/realizar`, {
    metodo: "PATCH",
  });
  return convertirMascota(respuesta);
}
export async function omitirCuidado(id: number, motivo: string) {
  const respuesta = await pedir<MascotaRespuesta>(`/mascotas/${id}/omitir`, {
    metodo: "PATCH",
    cuerpo: { motivo },
  });

  return convertirMascota(respuesta);
}

export async function reprogramarCuidado(
  id: number,
  nuevaFecha: string,
  motivo: string,
  alcance: AlcanceReprogramacion,
) {
  const respuesta = await pedir<MascotaRespuesta>(
    `/mascotas/${id}/reprogramar`,
    {
      metodo: "PATCH",
      cuerpo: { fecha_cuidado: nuevaFecha, motivo, alcance },
    },
  );
  return convertirMascota(respuesta);
}

export type FiltroCuidado = {
  nombre?: string;
  estado?: "pendiente" | "realizado";
  tipoCuidado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
};

export async function filtrarMascotas(filtros: FiltroCuidado = {}) {
  const parametros = new URLSearchParams();
  if (filtros.nombre?.trim()) {
    parametros.set("nombre", filtros.nombre.trim());
  }
  if (filtros.estado) {
    parametros.set("estado", filtros.estado);
  }
  if (filtros.tipoCuidado?.trim()) {
    parametros.set("tipo_cuidado", filtros.tipoCuidado.trim());
  }
  if (filtros.fechaDesde) {
    parametros.set("fecha_desde", filtros.fechaDesde);
  }
  if (filtros.fechaHasta) {
    parametros.set("fecha_hasta", filtros.fechaHasta);
  }
  const consulta = parametros.toString();
  const datos = await pedir<MascotaRespuesta[]>(
    `/mascotas/filtrar${consulta ? `?${consulta}` : ""}`,
  );
  return datos.map(convertirMascota);
}

export type RegistroHistorial = {
  id: number;
  tipoAccion: string;
  descripcion: string;
  fechaRegistro: string;
  mascotaId: number;
};

type RegistroHistorialRespuesta = {
  id: number;
  tipo_accion: string;
  descripcion: string;
  fecha_registro: string;
  mascota_id: number;
};

function convertirRegistroHistorial(
  datos: RegistroHistorialRespuesta,
): RegistroHistorial {
  return {
    id: datos.id,
    tipoAccion: datos.tipo_accion,
    descripcion: datos.descripcion,
    fechaRegistro: datos.fecha_registro,
    mascotaId: datos.mascota_id,
  };
}

export async function listarHistorial() {
  const datos = await pedir<RegistroHistorialRespuesta[]>("/historial");
  return datos.map(convertirRegistroHistorial);
}
export async function asignarResponsable(id: number, correo: string) {
  return pedir(`/mascotas/${id}/responsable`, {
    metodo: "PATCH",
    cuerpo: { correo },
  });
}

export type PermisoAcceso = "consulta" | "gestion";

export type Acceso = {
  id: number;
  propietarioNombre: string;
  invitadoNombre: string;
  invitadoCorreo: string;
  permiso: PermisoAcceso;
  estado: "pendiente" | "aceptado" | "rechazado" | "revocado";
};

type AccesoRespuesta = {
  id: number;
  propietario_nombre: string;
  invitado_nombre: string;
  invitado_correo: string;
  permiso: PermisoAcceso;
  estado: Acceso["estado"];
};

function convertirAcceso(datos: AccesoRespuesta): Acceso {
  return {
    id: datos.id,
    propietarioNombre: datos.propietario_nombre,
    invitadoNombre: datos.invitado_nombre,
    invitadoCorreo: datos.invitado_correo,
    permiso: datos.permiso,
    estado: datos.estado,
  };
}

export async function invitar(correo: string, permiso: PermisoAcceso) {
  await pedir<AccesoRespuesta>("/accesos", {
    metodo: "POST",
    cuerpo: { correo, permiso },
  });
}

export async function listarEnviados() {
  const datos = await pedir<AccesoRespuesta[]>("/accesos/enviados");
  return datos.map(convertirAcceso);
}

export async function listarRecibidos() {
  const datos = await pedir<AccesoRespuesta[]>("/accesos/recibidos");
  return datos.map(convertirAcceso);
}

export async function responderAcceso(
  id: number,
  accion: "aceptar" | "rechazar" | "revocar",
) {
  await pedir<AccesoRespuesta>(`/accesos/${id}/${accion}`, { metodo: "PATCH" });
}

// Analítica: cuántos cuidados se abren y cuántos se completan
export type EventoAnalitica = "cuidado_abierto" | "cuidado_completado";

// El mismo cuidado (mismo id de mascota) debe viajar con el mismo flujo_id
// en sus dos eventos para que el panel pueda contar el % que termina.
export function flujoIdDeCuidado(mascotaId: number): string {
  return `00000000-0000-4000-8000-${mascotaId.toString(16).padStart(12, "0")}`;
}

export async function registrarEvento(
  evento: EventoAnalitica,
  flujoId: string,
  recurrente?: boolean,
) {
  try {
    await pedir<{ id: number }>("/analitica/eventos", {
      metodo: "POST",
      cuerpo: {
        evento,
        flujo_id: flujoId,
        props: { recurrente: recurrente ?? null },
      },
    });
  } catch {
    // Un fallo al registrar el evento no debe interrumpir el flujo real de la persona.
  }
}

export type ResumenAnalitica = {
  iniciados: number;
  completados: number;
  porcentaje: number;
};

export async function obtenerResumenAnalitica() {
  return pedir<ResumenAnalitica>("/analitica/resumen");
}
