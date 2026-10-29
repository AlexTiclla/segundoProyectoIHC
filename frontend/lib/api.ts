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

type Opciones = { metodo?: "GET" | "POST" | "PUT"|"DELETE"|"PATCH"; cuerpo?: unknown };

async function pedir<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: opciones.metodo ?? "GET",
      headers: opciones.cuerpo ? { "Content-Type": "application/json" } : undefined,
      body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi("No se pudo conectar con el servidor. Intenta de nuevo.", 0);
  }

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    if (respuesta.status ===401 && !ruta.startsWith("/auth/") && typeof window !== "undefined"){
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
  return { id: datos.id, nombreCompleto: datos.nombre_completo, correo: datos.correo };
}

export async function registrar(nombreCompleto: string, correo: string, contrasena: string) {
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

export async function cambiarContrasena(correo: string, codigo: string, contrasenaNueva: string) {
  return pedir<{ mensaje: string }>("/auth/cambiar-contrasena", {
    metodo: "POST",
    cuerpo: { correo, codigo, contrasena_nueva: contrasenaNueva },
  });
}

export type Mascota ={
  id: number;
  nombre: string;
  sexo: string;
  especie: string;
  cuidado: string;
  fechaCuidado: string;
  estado:string;
  responsableNombre: string | null;
};

export type DatosMascota = Omit<
  Mascota,
  "id" | "estado" | "responsableNombre"
>;

type MascotaRespuesta ={
  id:number;
  nombre: string;
  sexo: string;
  especie: string;
  cuidado: string;
  fecha_cuidado: string;
  estado: string;
  usuario_id: number;
  responsable_nombre: string | null;
};

function convertirMascota(datos: MascotaRespuesta): Mascota {
 return {id:datos.id, nombre: datos.nombre, sexo: datos.sexo, especie: datos.especie,cuidado: datos.cuidado, fechaCuidado: datos.fecha_cuidado, estado:datos.estado, responsableNombre: datos.responsable_nombre, };  
}

function cuerpoMascota(datos: DatosMascota) {
  return {
    nombre: datos.nombre,
    sexo: datos.sexo,
    especie: datos.especie,
    cuidado: datos.cuidado,
    fecha_cuidado: datos.fechaCuidado,
  };
}

function cuerpoMascotaActualizar(datos: DatosMascota) {
  return {
    nombre: datos.nombre,
    sexo: datos.sexo,
    especie: datos.especie,
    cuidado: datos.cuidado,
  };
}


export async function listarMascotas() {
  const datos = await pedir<MascotaRespuesta[]>("/mascotas");
  return datos.map(convertirMascota);
}

export async function crearMascota(datos: DatosMascota) {
  return pedir<MascotaRespuesta>("/mascotas",{
    metodo: "POST",
    cuerpo: cuerpoMascota(datos)
  });   
}

export async function actualizarMascota(id: number, datos: DatosMascota) {
 return pedir<MascotaRespuesta>(`/mascotas/${id}`,{
  metodo: "PUT", 
  cuerpo: cuerpoMascotaActualizar(datos)
 });
}

export async function eliminarMascota(id: number) {
  return pedir<null>(`/mascotas/${id}`,{
   metodo: "DELETE"
  });
}

export async function marcarRealizado(id: number){
  const respuesta = await pedir<MascotaRespuesta>(`/mascotas/${id}/realizar`,{
   metodo: "PATCH",
  });
  return convertirMascota(respuesta);
}

export async function reprogramarCuidado(id:number,nuevaFecha:string){
  const respuesta = await pedir<MascotaRespuesta>(`/mascotas/${id}/reprogramar`,{
    metodo: "PATCH",
    cuerpo: {fecha_cuidado: nuevaFecha} 
  });
  return convertirMascota(respuesta);
}

export type FiltroCuidado = {
  nombre?:string;
  estado?: "pendiente"|"realizado";
  tipoCuidado?:string;
  fechaDesde?:string;
  fechaHasta?:string;
};

export async function filtrarMascotas(filtros:FiltroCuidado={}){
  const parametros = new URLSearchParams();
  if(filtros.nombre?.trim()){
    parametros.set("nombre",filtros.nombre.trim());
  }
  if(filtros.estado){
    parametros.set("estado", filtros.estado);
  }
  if(filtros.tipoCuidado?.trim()){ 
    parametros.set("tipo_cuidado", filtros.tipoCuidado.trim());
  }
  if(filtros.fechaDesde){
    parametros.set("fecha_desde", filtros.fechaDesde);
  }
  if(filtros.fechaHasta){
    parametros.set("fecha_hasta", filtros.fechaHasta);
  }
  const consulta = parametros.toString();
  const datos = await pedir<MascotaRespuesta[]>(`/mascotas/filtrar${consulta ? `?${consulta}` : ""}`);
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

function convertirRegistroHistorial(datos: RegistroHistorialRespuesta): RegistroHistorial {
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
    cuerpo: { correo }
  });
}