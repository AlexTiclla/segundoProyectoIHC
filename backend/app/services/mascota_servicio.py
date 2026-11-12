from sqlalchemy.orm import Session
from app.errores import ErrorDeNegocio
from app.models.acceso import CONSULTA, GESTION
from app.models.mascota import Mascota
from app.models.reprogramacion import FUTURAS, SOLO_ESTA
from app.recurrencia import CANTIDAD_MAXIMA, texto_intervalo
from app.schemas.mascota import MascotaEntrada,MascotaActualizada
from app.repositories import acceso_repositorio as repo_acceso
from app.repositories import mascota_repositorio as repo
from app.repositories import usuario_repositorio as repo_usuario
from app.services import historial_servicio
from datetime import date

PROPIETARIO = "propietario"
PUEDEN_VER = (PROPIETARIO, CONSULTA, GESTION)
PUEDEN_GESTIONAR = (PROPIETARIO, GESTION)

def obtener(session:Session, mascota_id:int, usuario_id:int) -> Mascota:
    return _obtener_con_permiso(session,mascota_id,usuario_id,PUEDEN_VER)

# Para lo que solo hace el propietario: eliminar y asignar responsable
def _obtener_propia(session:Session, mascota_id:int, usuario_id:int) -> Mascota:
    mascota = repo.buscar_por_id(session, mascota_id)
    if mascota is None or mascota.usuario_id != usuario_id:
        raise ErrorDeNegocio("No se encontró la mascota",404)
    return mascota

# El propietario, o quien tenga un acceso aceptado a su lista con alguno de los permisos pedidos.
# Sin acceso es 404, para no revelar que el cuidado existe.
def _obtener_con_permiso(session:Session, mascota_id:int, usuario_id:int, permitidos:tuple) -> Mascota:
    mascota = repo.buscar_por_id(session, mascota_id)
    if mascota is None:
        raise ErrorDeNegocio("No se encontró la mascota",404)
    if mascota.usuario_id == usuario_id:
        permiso = PROPIETARIO
    else:
        acceso = repo_acceso.buscar_aceptado(session,mascota.usuario_id,usuario_id)
        if acceso is None:
            raise ErrorDeNegocio("No se encontró la mascota",404)
        permiso = acceso.permiso
    if permiso not in permitidos:
        raise ErrorDeNegocio("Tu permiso es solo de consulta: no puedes modificar este cuidado",403)
    mascota.permiso = permiso
    return mascota

def _con_permiso(session:Session, mascotas:list[Mascota], usuario_id:int) -> list[Mascota]:
    permisos = repo_acceso.permisos_recibidos(session,usuario_id)
    for mascota in mascotas:
        mascota.permiso = PROPIETARIO if mascota.usuario_id == usuario_id else permisos[mascota.usuario_id]
    return mascotas

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
    return _con_permiso(session,repo.buscar_por_usuario(session,usuario_id),usuario_id)

def actualizar_mascota(session:Session, mascota_id:int, datos: MascotaActualizada, usuario_id: int):
    mascota = _obtener_con_permiso(session,mascota_id,usuario_id,PUEDEN_GESTIONAR)
    if mascota.estado != "pendiente":
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
    mascota = _obtener_con_permiso(session,mascota_id,usuario_id,PUEDEN_GESTIONAR)
    if mascota.estado != "pendiente":
        raise ErrorDeNegocio(
            "Este cuidado ya está finalizado y no puede marcarse como realizado",
            400
        )
    proxima_fecha = mascota.proxima_fecha
    if proxima_fecha is None:
        siguiente = None
        mascota = repo.marcar_realizada(session,mascota,usuario_id)
    else:
        mascota, siguiente = repo.realizar_y_programar(session,mascota,proxima_fecha,usuario_id)
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

def reprogramar_cuidado(session:Session,mascota_id:int,usuario_id:int,nueva_fecha:date,motivo:str,alcance:str=SOLO_ESTA):
    mascota = _obtener_con_permiso(session,mascota_id,usuario_id,PUEDEN_GESTIONAR)
    if(mascota.estado != "pendiente"):
        raise ErrorDeNegocio("Este cuidado ya fue realizado, por eso no se puede reprogramar",400)
    if nueva_fecha < date.today():
        raise ErrorDeNegocio("La nueva fecha no puede ser anterior a hoy", 400)
    fecha_anterior = mascota.fecha_cuidado
    if nueva_fecha == fecha_anterior:
        raise ErrorDeNegocio("Elige una fecha distinta a la actual",400)
    motivo = motivo.strip()
    if not motivo:
        raise ErrorDeNegocio("Escribe el motivo del cambio",400)
    if alcance == FUTURAS and not mascota.intervalo_cantidad:
        raise ErrorDeNegocio("Este cuidado no se repite, por eso no tiene fechas siguientes",400)

    # Con "solo esta" la base no se mueve, así las siguientes siguen en sus fechas.
    # Con "futuras" la base se mueve lo mismo que esta fecha, y las siguientes con ella.
    base = mascota.fecha_base or fecha_anterior
    if alcance == FUTURAS:
        base += nueva_fecha - fecha_anterior

    mascota = repo.reprogramar(session,mascota,nueva_fecha,base,motivo,alcance)
    texto_alcance = "esta y las siguientes" if alcance == FUTURAS else "solo esta fecha"
    historial_servicio.registrar(
        session,
        "reprogramar",
        f"Se reprogramó el cuidado de '{mascota.nombre}' del {fecha_anterior.isoformat()} al {nueva_fecha.isoformat()} "
        f"({texto_alcance}). Motivo: {motivo}",
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
    mascotas = repo.filtrar_por_usuario(session,usuario_id,nombre,estado,tipo_cuidado,fecha_desde,fecha_hasta)
    return _con_permiso(session,mascotas,usuario_id)

def asignar_responsable(
    session: Session,
    mascota_id: int,
    correo: str,
    usuario_id: int
):
    mascota = _obtener_propia(session, mascota_id, usuario_id)

    if mascota.estado != "pendiente":
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

def omitir_cuidado(
    session: Session,
    mascota_id: int,
    usuario_id: int,
    motivo: str
):
    mascota = _obtener_con_permiso(
        session,
        mascota_id,
        usuario_id,
        PUEDEN_GESTIONAR
    )

    if not mascota.vencido:
        raise ErrorDeNegocio(
            "Solo se pueden omitir cuidados vencidos",
            400
        )

    motivo = motivo.strip()

    if not motivo:
        raise ErrorDeNegocio(
            "Debes indicar el motivo de la omisión",
            400
        )

    proxima_fecha = mascota.proxima_fecha

    mascota, siguiente = repo.omitir(
        session,
        mascota,
        motivo,
        proxima_fecha
    )

    historial_servicio.registrar(
        session,
        "omitir",
        f"Se omitió el cuidado de '{mascota.nombre}'. Motivo: {motivo}",
        usuario_id,
        mascota.id
    )

    if siguiente is not None:
        historial_servicio.registrar(
            session,
            "programar",
            f"Se programó el próximo cuidado de '{siguiente.nombre}' "
            f"para el {proxima_fecha.isoformat()}.",
            usuario_id,
            siguiente.id
        )

    return mascota