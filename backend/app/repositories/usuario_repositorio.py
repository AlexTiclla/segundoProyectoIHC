from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.usuario import Usuario
from app.utilidades import ahora_utc


def buscar_por_correo(sesion: Session, correo: str) -> Usuario | None:
    return sesion.scalar(select(Usuario).where(Usuario.correo == correo))


def buscar_por_id(sesion: Session, usuario_id: int) -> Usuario | None:
    return sesion.get(Usuario, usuario_id)


def crear(sesion: Session, nombre_completo: str, correo: str, contrasena_hash: str) -> Usuario:
    usuario = Usuario(
        nombre_completo=nombre_completo,
        correo=correo,
        contrasena_hash=contrasena_hash,
    )
    sesion.add(usuario)
    sesion.commit()
    sesion.refresh(usuario)
    return usuario


def guardar_codigo_recuperacion(
    sesion: Session, usuario: Usuario, codigo_hash: str, expira_en: datetime
) -> None:
    usuario.codigo_recuperacion_hash = codigo_hash
    usuario.codigo_expira_en = expira_en
    sesion.commit()


def actualizar_contrasena(sesion: Session, usuario: Usuario, contrasena_hash: str) -> None:
    usuario.contrasena_hash = contrasena_hash
    usuario.codigo_recuperacion_hash = None
    usuario.codigo_expira_en = None
    sesion.commit()


# No borra la fila: las mascotas, el historial y los accesos la siguen referenciando.
# Libera el correo y deja una contraseña irrecuperable para que la cuenta no se pueda
# volver a usar, conservando el nombre visible como "Usuario eliminado".
def anonimizar(sesion: Session, usuario: Usuario, contrasena_hash_irrecuperable: str) -> Usuario:
    usuario.nombre_completo = "Usuario eliminado"
    usuario.correo = f"usuario-eliminado-{usuario.id}@mascotaaldia.invalid"
    usuario.contrasena_hash = contrasena_hash_irrecuperable
    usuario.codigo_recuperacion_hash = None
    usuario.codigo_expira_en = None
    usuario.eliminado = True
    usuario.eliminado_en = ahora_utc()
    sesion.commit()
    sesion.refresh(usuario)
    return usuario