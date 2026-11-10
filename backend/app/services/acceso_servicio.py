from sqlalchemy.orm import Session
from app.errores import ErrorDeNegocio
from app.models.acceso import Acceso, ACEPTADO, PENDIENTE, RECHAZADO, REVOCADO
from app.repositories import acceso_repositorio as repo
from app.repositories import usuario_repositorio as repo_usuario


def invitar(session: Session, propietario_id: int, correo: str, permiso: str) -> Acceso:
    invitado = repo_usuario.buscar_por_correo(session, correo.strip().lower())
    if invitado is None:
        raise ErrorDeNegocio("No existe una cuenta con ese correo", 404)
    if invitado.id == propietario_id:
        raise ErrorDeNegocio("No puedes compartir tus cuidados contigo mismo", 400)
    if repo.buscar_vigente(session, propietario_id, invitado.id):
        raise ErrorDeNegocio("Ya hay una invitación vigente para esa cuenta", 409)
    return repo.crear(session, propietario_id, invitado.id, permiso)


# Solo el invitado responde, y solo una vez
def responder(session: Session, acceso_id: int, usuario_id: int, aceptar: bool) -> Acceso:
    acceso = repo.buscar_por_id(session, acceso_id)
    if acceso is None or acceso.invitado_id != usuario_id:
        raise ErrorDeNegocio("No se encontró la invitación", 404)
    if acceso.estado != PENDIENTE:
        raise ErrorDeNegocio("Esta invitación ya fue respondida", 400)
    return repo.cambiar_estado(session, acceso, ACEPTADO if aceptar else RECHAZADO)


# Solo el propietario administra los accesos. Revocar no borra: el acceso queda como revocado.
def revocar(session: Session, acceso_id: int, usuario_id: int) -> Acceso:
    acceso = repo.buscar_por_id(session, acceso_id)
    if acceso is None or acceso.propietario_id != usuario_id:
        raise ErrorDeNegocio("No se encontró el acceso", 404)
    if acceso.estado not in (PENDIENTE, ACEPTADO):
        raise ErrorDeNegocio("Este acceso ya no está vigente", 400)
    return repo.cambiar_estado(session, acceso, REVOCADO)


def enviados(session: Session, usuario_id: int) -> list[Acceso]:
    return repo.listar_enviados(session, usuario_id)


def recibidos(session: Session, usuario_id: int) -> list[Acceso]:
    return repo.listar_recibidos(session, usuario_id)
