from datetime import timedelta

from sqlalchemy.orm import Session

from app.config import configuracion
from app.errores import ErrorDeNegocio
from app.models.usuario import Usuario
from app.repositories import usuario_repositorio as repositorio
from app.schemas.usuario import (
    CambioContrasenaEntrada,
    IngresoEntrada,
    RegistroEntrada,
)
from app.seguridad import (
    generar_codigo,
    hashear_contrasena,
    leer_token,
    verificar_contrasena,
)
from app.utilidades import ahora_utc


def registrar(sesion: Session, datos: RegistroEntrada) -> Usuario:
    if repositorio.buscar_por_correo(sesion, datos.correo):
        raise ErrorDeNegocio("Ya existe una cuenta con ese correo", 409)
    return repositorio.crear(
        sesion,
        datos.nombre_completo,
        datos.correo,
        hashear_contrasena(datos.contrasena),
    )


def autenticar(sesion: Session, datos: IngresoEntrada) -> Usuario:
    usuario = repositorio.buscar_por_correo(sesion, datos.correo)
    if usuario is None or not verificar_contrasena(datos.contrasena, usuario.contrasena_hash):
        raise ErrorDeNegocio("Correo o contraseña incorrectos", 401)
    return usuario


def usuario_desde_token(sesion: Session, token: str | None) -> Usuario:
    usuario_id = leer_token(token) if token else None
    usuario = repositorio.buscar_por_id(sesion, usuario_id) if usuario_id else None
    if usuario is None:
        raise ErrorDeNegocio("No has iniciado sesión", 401)
    return usuario


def solicitar_recuperacion(sesion: Session, correo: str) -> str | None:
    usuario = repositorio.buscar_por_correo(sesion, correo)
    if usuario is None:
        return None
    codigo = generar_codigo()
    expira_en = ahora_utc() + timedelta(minutes=configuracion.minutos_codigo_recuperacion)
    repositorio.guardar_codigo_recuperacion(
        sesion, usuario, hashear_contrasena(codigo), expira_en
    )
    return codigo


def cambiar_contrasena(sesion: Session, datos: CambioContrasenaEntrada) -> None:
    usuario = repositorio.buscar_por_correo(sesion, datos.correo)
    codigo_valido = (
        usuario is not None
        and usuario.codigo_recuperacion_hash is not None
        and usuario.codigo_expira_en is not None
        and usuario.codigo_expira_en > ahora_utc()
        and verificar_contrasena(datos.codigo, usuario.codigo_recuperacion_hash)
    )
    if not codigo_valido:
        raise ErrorDeNegocio("Código inválido o vencido", 400)
    repositorio.actualizar_contrasena(
        sesion, usuario, hashear_contrasena(datos.contrasena_nueva)
    )