from datetime import date
from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from app.models.acceso import Acceso, ACEPTADO
from app.models.mascota import Mascota, REALIZADO
from app.models.reprogramacion import Reprogramacion


# Los cuidados propios y los de quienes compartieron su lista con este usuario
def _visibles(usuario_id: int):
    propietarios = select(Acceso.propietario_id).where(
        Acceso.invitado_id == usuario_id,
        Acceso.estado == ACEPTADO,
    )
    return or_(Mascota.usuario_id == usuario_id, Mascota.usuario_id.in_(propietarios))


def buscar_por_id(session: Session, mascota_id: int) -> Mascota | None:
    return session.scalar(
        select(Mascota).where(
            Mascota.id == mascota_id,
            Mascota.eliminada.is_(False),
        )
    )


def buscar_por_usuario(
    session: Session,
    usuario_id: int,
) -> list[Mascota]:
    consulta = select(Mascota).where(
        _visibles(usuario_id),
        Mascota.eliminada.is_(False),
    )
    return session.scalars(consulta).all()


def crear(
    session: Session,
    nombre: str,
    sexo: str,
    especie: str,
    cuidado: str,
    fecha_cuidado: date,
    usuario_id: int,
    intervalo_cantidad: int | None = None,
    intervalo_unidad: str | None = None,
) -> Mascota:
    mascota = Mascota(
        nombre=nombre,
        sexo=sexo,
        especie=especie,
        cuidado=cuidado,
        fecha_cuidado=fecha_cuidado,
        usuario_id=usuario_id,
        intervalo_cantidad=intervalo_cantidad,
        intervalo_unidad=intervalo_unidad,
    )
    session.add(mascota)
    session.commit()
    session.refresh(mascota)
    return mascota


def actualizar(
    session: Session,
    mascota: Mascota,
    nombre: str,
    sexo: str,
    especie: str,
    cuidado: str,
    intervalo_cantidad: int | None = None,
    intervalo_unidad: str | None = None,
) -> Mascota:
    mascota.nombre = nombre
    mascota.sexo = sexo
    mascota.especie = especie
    mascota.cuidado = cuidado
    mascota.intervalo_cantidad = intervalo_cantidad
    mascota.intervalo_unidad = intervalo_unidad
    session.commit()
    session.refresh(mascota)
    return mascota


def eliminar(session: Session, mascota: Mascota) -> None:
    mascota.eliminada = True
    session.commit()


def marcar_realizada(
    session: Session,
    mascota: Mascota,
    usuario_id: int,
) -> Mascota:
    _registrar_realizacion(mascota, usuario_id)
    session.commit()
    session.refresh(mascota)
    return mascota


def _registrar_realizacion(mascota: Mascota, usuario_id: int) -> None:
    mascota.estado = REALIZADO
    mascota.realizado_por_id = usuario_id
    mascota.realizado_en = date.today()


# Un solo commit: el cuidado no puede quedar realizado sin su siguiente ocurrencia.
def realizar_y_programar(
    session: Session,
    mascota: Mascota,
    proxima_fecha: date,
    usuario_id: int,
) -> tuple[Mascota, Mascota]:
    siguiente = Mascota(
        nombre=mascota.nombre,
        sexo=mascota.sexo,
        especie=mascota.especie,
        cuidado=mascota.cuidado,
        fecha_cuidado=proxima_fecha,
        usuario_id=mascota.usuario_id,
        responsable_id=mascota.responsable_id,
        intervalo_cantidad=mascota.intervalo_cantidad,
        intervalo_unidad=mascota.intervalo_unidad,
    )
    _registrar_realizacion(mascota, usuario_id)
    session.add(siguiente)
    session.commit()
    session.refresh(mascota)
    session.refresh(siguiente)
    return mascota, siguiente


# Un solo commit: la fecha no puede cambiar sin que quede su registro.
def reprogramar(
    session: Session,
    mascota: Mascota,
    nueva_fecha: date,
    nueva_base: date,
    motivo: str,
    alcance: str,
) -> Mascota:
    session.add(
        Reprogramacion(
            mascota_id=mascota.id,
            fecha_anterior=mascota.fecha_cuidado,
            fecha_nueva=nueva_fecha,
            diferencia_dias=(nueva_fecha - mascota.fecha_cuidado).days,
            motivo=motivo,
            alcance=alcance,
        )
    )
    mascota.fecha_cuidado = nueva_fecha
    mascota.fecha_base = nueva_base
    session.commit()
    session.refresh(mascota)
    return mascota


def asignar_responsable(
    session: Session,
    mascota: Mascota,
    responsable_id: int,
) -> Mascota:
    mascota.responsable_id = responsable_id
    session.commit()
    session.refresh(mascota)
    return mascota


def filtrar_por_usuario(
    session: Session,
    usuario_id: int,
    nombre: str | None = None,
    estado: str | None = None,
    tipo_cuidado: str | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
) -> list[Mascota]:
    consulta = select(Mascota).where(
        _visibles(usuario_id),
        Mascota.eliminada.is_(False),
    )

    if nombre and nombre.strip():
        consulta = consulta.where(
            Mascota.nombre.icontains(nombre.strip(), autoescape=True)
        )

    if estado:
        consulta = consulta.where(Mascota.estado == estado)

    if tipo_cuidado and tipo_cuidado.strip():
        consulta = consulta.where(
            Mascota.cuidado.icontains(
                tipo_cuidado.strip(),
                autoescape=True,
            )
        )

    if fecha_desde:
        consulta = consulta.where(Mascota.fecha_cuidado >= fecha_desde)

    if fecha_hasta:
        consulta = consulta.where(Mascota.fecha_cuidado <= fecha_hasta)

    # "pendiente" va antes que "realizado", y los más atrasados quedan arriba.
    consulta = consulta.order_by(
        Mascota.estado,
        Mascota.fecha_cuidado,
        Mascota.id,
    )

    return session.scalars(consulta).all()

def omitir(
    session: Session,
    mascota: Mascota,
    motivo: str,
    proxima_fecha: date | None
) -> tuple[Mascota, Mascota | None]:

    mascota.estado = "omitido"
    mascota.motivo_omision = motivo

    siguiente = None

    if proxima_fecha is not None:
        siguiente = Mascota(
            nombre=mascota.nombre,
            sexo=mascota.sexo,
            especie=mascota.especie,
            cuidado=mascota.cuidado,
            fecha_cuidado=proxima_fecha,
            usuario_id=mascota.usuario_id,
            responsable_id=mascota.responsable_id,
            intervalo_cantidad=mascota.intervalo_cantidad,
            intervalo_unidad=mascota.intervalo_unidad,
        )

        session.add(siguiente)

    session.commit()
    session.refresh(mascota)

    if siguiente is not None:
        session.refresh(siguiente)

    return mascota, siguiente

def omitir(
    session: Session,
    mascota: Mascota,
    motivo: str,
    proxima_fecha: date | None
) -> tuple[Mascota, Mascota | None]:

    mascota.estado = "omitido"
    mascota.motivo_omision = motivo

    siguiente = None

    if proxima_fecha is not None:
        siguiente = Mascota(
            nombre=mascota.nombre,
            sexo=mascota.sexo,
            especie=mascota.especie,
            cuidado=mascota.cuidado,
            fecha_cuidado=proxima_fecha,
            usuario_id=mascota.usuario_id,
            responsable_id=mascota.responsable_id,
            intervalo_cantidad=mascota.intervalo_cantidad,
            intervalo_unidad=mascota.intervalo_unidad,
        )

        session.add(siguiente)

    session.commit()
    session.refresh(mascota)

    if siguiente is not None:
        session.refresh(siguiente)

    return mascota, siguiente