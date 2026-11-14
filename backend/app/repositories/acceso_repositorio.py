from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from app.models.acceso import Acceso, ACEPTADO, PENDIENTE, REVOCADO


def crear(session: Session, propietario_id: int, invitado_id: int, permiso: str) -> Acceso:
    acceso = Acceso(propietario_id=propietario_id, invitado_id=invitado_id, permiso=permiso)
    session.add(acceso)
    session.commit()
    session.refresh(acceso)
    return acceso


def buscar_por_id(session: Session, acceso_id: int) -> Acceso | None:
    return session.get(Acceso, acceso_id)


def buscar_aceptado(session: Session, propietario_id: int, invitado_id: int) -> Acceso | None:
    return session.scalar(
        select(Acceso).where(
            Acceso.propietario_id == propietario_id,
            Acceso.invitado_id == invitado_id,
            Acceso.estado == ACEPTADO,
        )
    )


# Pendiente o aceptado: con una invitación así no se puede invitar otra vez
def buscar_vigente(session: Session, propietario_id: int, invitado_id: int) -> Acceso | None:
    return session.scalar(
        select(Acceso).where(
            Acceso.propietario_id == propietario_id,
            Acceso.invitado_id == invitado_id,
            Acceso.estado.in_([PENDIENTE, ACEPTADO]),
        )
    )


def listar_enviados(session: Session, propietario_id: int) -> list[Acceso]:
    consulta = select(Acceso).where(Acceso.propietario_id == propietario_id).order_by(Acceso.id.desc())
    return session.scalars(consulta).all()


def listar_recibidos(session: Session, invitado_id: int) -> list[Acceso]:
    consulta = select(Acceso).where(Acceso.invitado_id == invitado_id).order_by(Acceso.id.desc())
    return session.scalars(consulta).all()


# {id del propietario: permiso} de lo que otros comparten con este usuario
def permisos_recibidos(session: Session, invitado_id: int) -> dict[int, str]:
    consulta = select(Acceso.propietario_id, Acceso.permiso).where(
        Acceso.invitado_id == invitado_id,
        Acceso.estado == ACEPTADO,
    )
    return {propietario_id: permiso for propietario_id, permiso in session.execute(consulta)}


def cambiar_estado(session: Session, acceso: Acceso, estado: str) -> Acceso:
    acceso.estado = estado
    session.commit()
    session.refresh(acceso)
    return acceso


# Al eliminar una cuenta: revoca tanto lo que compartió como lo que recibió.
# No se borra ningún acceso, igual que al revocar uno solo.
def revocar_todos_de_usuario(session: Session, usuario_id: int) -> None:
    consulta = select(Acceso).where(
        or_(Acceso.propietario_id == usuario_id, Acceso.invitado_id == usuario_id),
        Acceso.estado.in_([PENDIENTE, ACEPTADO]),
    )
    for acceso in session.scalars(consulta).all():
        acceso.estado = REVOCADO
    session.commit()
