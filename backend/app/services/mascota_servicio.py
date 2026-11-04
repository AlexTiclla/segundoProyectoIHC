from sqlalchemy.orm import Session
from app.errores import ErrorDeNegocio
from app.models.mascota import Mascota
from app.recurrencia import CANTIDAD_MAXIMA, texto_intervalo
from app.schemas.mascota import MascotaEntrada,MascotaActualizada
from app.repositories import mascota_repositorio as repo
from app.repositories import usuario_repositorio as repo_usuario
from app.services import historial_servicio
from datetime import date

def obtener_propia(session:Session, mascota_id:int, usuario_id:int) -> Mascota:
    return _obtener_propia(session,mascota_id,usuario_id)

def _obtener_propia(session:Session, mascota_id:int, usuario_id:int) -> Mascota:
    mascota = repo.buscar_por_id(session, mascota_id)
    if mascota is None or mascota.usuario_id != usuario_id:
        raise ErrorDeNegocio("No se encontró la mascota",404)
    return mascota

def _validar_intervalo(cantidad:int|None, unidad:str|None):
    if cantidad is None and unidad is None:
        return
    if cantidad is None or unidad is None:
        raise ErrorDeNegocio("Indica cada cuánto se repite el cuidado",400)
    if not 1 <= cantidad <= CANTIDAD_MAXIMA:
        raise ErrorDeNegocio(f"La repetición debe ser de 1 a {CANTIDAD_MAXIMA}",400)

def crear_mascota(session:Session, datos: MascotaEntrada, usuario_id: int):
    usuario = repo_usuario.buscar_por_id(session,usuario_id)
    if usuario is None:
        raise ErrorDeNegocio("No se encontró el usuario",404)
    if datos.fecha_cuidado < date.today():
        raise ErrorDeNegocio("La fecha del cuidado no puede ser anterior a hoy",400)
    _validar_intervalo(datos.intervalo_cantidad,datos.intervalo_unidad)
    mascota = repo.crear(session,datos.nombre,datos.sexo,datos.especie,datos.cuidado,datos.fecha_cuidado,usuario_id,datos.intervalo_cantidad,datos.intervalo_unidad)
    descripcion = f"Se creó la mascota '{mascota.nombre}' para {usuario.nombre_completo}."
    if mascota.intervalo_cantidad:
        descripcion += f" El cuidado se repite {texto_intervalo(mascota.intervalo_cantidad,mascota.intervalo_unidad)}."
    historial_servicio.registrar(
        session,
        "crear",
        descripcion,
        usuario_id,
        mascota.id,
    )
    return mascota

def listar_mascotas(session:Session, usuario_id: int):
    usuario = repo_usuario.buscar_por_id(session,usuario_id)
    if usuario is None:
        raise ErrorDeNegocio("No se encontró el usuario",404)
    return repo.buscar_por_usuario(session,usuario_id)

def actualizar_mascota(session:Session, mascota_id:int, datos: MascotaActualizada, usuario_id: int):
    mascota = _obtener_propia(session,mascota_id,usuario_id)
    if mascota.estado == "realizado":
        raise ErrorDeNegocio("Este cuidado ya fue realizado, por eso no se puede editar",400)
    _validar_intervalo(datos.intervalo_cantidad,datos.intervalo_unidad)
    mascota = repo.actualizar(session,mascota,datos.nombre,datos.sexo,datos.especie,datos.cuidado,datos.intervalo_cantidad,datos.intervalo_unidad)
    historial_servicio.registrar(
        session,
        "actualizar",
        f"Se actualizó la mascota '{mascota.nombre}' con los nuevos datos.",
        usuario_id,
        mascota.id,
    )
    return mascota

def eliminar_mascota(session:Session, mascota_id:int, usuario_id: int):
    mascota = _obtener_propia(session,mascota_id,usuario_id)
    repo.eliminar(session,mascota)
    historial_servicio.registrar(
        session,
        "eliminar",
        f"Se eliminó la mascota '{mascota.nombre}'.",
        usuario_id,
        mascota.id,
    )

def marcar_realizado(session:Session,mascota_id:int, usuario_id:int):
    mascota =_obtener_propia(session,mascota_id,usuario_id)
    if mascota.estado == "realizado":
        raise ErrorDeNegocio("Este cuidado ya está marcado como realizado",400)
    proxima_fecha = mascota.proxima_fecha
    if proxima_fecha is None:
        siguiente = None
        mascota = repo.cambiar_estado(session,mascota,"realizado")
    else:
        mascota, siguiente = repo.realizar_y_programar(session,mascota,proxima_fecha)
    historial_servicio.registrar(
        session,
        "realizar",
        f"Se marcó como realizado el cuidado de '{mascota.nombre}'.",
        usuario_id,
        mascota.id,
    )
    if siguiente is not None:
        historial_servicio.registrar(
            session,
            "programar",
            f"Se programó el próximo cuidado de '{siguiente.nombre}' para el {proxima_fecha.isoformat()} "
            f"({texto_intervalo(siguiente.intervalo_cantidad,siguiente.intervalo_unidad)}).",
            usuario_id,
            siguiente.id,
        )
    return mascota

def reprogramar_cuidado(session:Session,mascota_id:int,usuario_id:int,nueva_fecha:date):
    mascota = _obtener_propia(session,mascota_id,usuario_id)
    if(mascota.estado == "realizado"):
        raise ErrorDeNegocio("Este cuidado ya fue realizado, por eso no se puede reprogramar",400)
    if nueva_fecha < date.today():
        raise ErrorDeNegocio("La nueva fecha no puede ser anterior a hoy", 400)
    mascota = repo.actualizar_fecha_cuidado(session,mascota,nueva_fecha)
    historial_servicio.registrar(
        session,
        "reprogramar",
        f"Se reprogramó el cuidado de '{mascota.nombre}' para el {nueva_fecha.isoformat()}.",
        usuario_id,
        mascota.id,
    )
    return mascota

def filtrar_mascotas(session:Session,usuario_id:int,nombre:str|None=None,estado:str|None=None,tipo_cuidado:str|None=None,fecha_desde:date|None=None,fecha_hasta:date|None=None):
    usuario = repo_usuario.buscar_por_id(session,usuario_id)
    if usuario is None:
        raise ErrorDeNegocio("No se encontró el usuario",404)
    if fecha_desde and fecha_hasta and fecha_desde > fecha_hasta:
        raise ErrorDeNegocio("La fecha inicial no puede ser posterior a la fecha final",400)
    return repo.filtrar_por_usuario(session,usuario_id,nombre,estado,tipo_cuidado,fecha_desde,fecha_hasta)

def asignar_responsable(
    session: Session,
    mascota_id: int,
    correo: str,
    usuario_id: int
):
    mascota = _obtener_propia(session, mascota_id, usuario_id)

    if mascota.estado == "realizado":
        raise ErrorDeNegocio("El cuidado ya fue realizado", 400)

    responsable = repo_usuario.buscar_por_correo(
        session, correo.strip().lower()
    )

    if responsable is None:
        raise ErrorDeNegocio("No existe una cuenta con ese correo", 404)

    mascota = repo.asignar_responsable(session, mascota, responsable.id)
    historial_servicio.registrar(
        session,
        "responsable",
        f"Se asignó a {responsable.nombre_completo} como responsable del cuidado de '{mascota.nombre}'.",
        usuario_id,
        mascota.id,
    )
    return mascota