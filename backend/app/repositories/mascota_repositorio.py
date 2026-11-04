from datetime import date
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.mascota import Mascota


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
        Mascota.usuario_id == usuario_id,
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
) -> Mascota:
    mascota = Mascota(
        nombre=nombre,
        sexo=sexo,
        especie=especie,
        cuidado=cuidado,
        fecha_cuidado=fecha_cuidado,
        usuario_id=usuario_id,
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
) -> Mascota:
    mascota.nombre = nombre
    mascota.sexo = sexo
    mascota.especie = especie
    mascota.cuidado = cuidado
    session.commit()
    session.refresh(mascota)
    return mascota


def eliminar(session: Session, mascota: Mascota) -> None:
    mascota.eliminada = True
    session.commit()


def cambiar_estado(
    session: Session,
    mascota: Mascota,
    estado: str,
) -> Mascota:
    mascota.estado = estado
    session.commit()
    session.refresh(mascota)
    return mascota


def actualizar_fecha_cuidado(
    session: Session,
    mascota: Mascota,
    nueva_fecha: date,
) -> Mascota:
    mascota.fecha_cuidado = nueva_fecha
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
        Mascota.usuario_id == usuario_id,
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
