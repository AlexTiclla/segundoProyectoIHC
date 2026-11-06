from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.base_datos import obtener_sesion
from app.config import configuracion
from app.dependencias import obtener_usuario_actual
from app.models.usuario import Usuario
from app.schemas.usuario import (
    CambioContrasenaEntrada,
    IngresoEntrada,
    MensajeSalida,
    RecuperarEntrada,
    RecuperarSalida,
    RegistroEntrada,
    UsuarioSalida,
)
from app.seguridad import crear_token
from app.services import auth_servicio

router = APIRouter(prefix="/auth", tags=["Autenticacion"])


@router.post("/registro", response_model=UsuarioSalida, status_code=201)
def registro(datos: RegistroEntrada, sesion: Session = Depends(obtener_sesion)):
    return auth_servicio.registrar(sesion, datos)


@router.post("/ingresar", response_model=UsuarioSalida)
def ingresar(
    datos: IngresoEntrada,
    respuesta: Response,
    sesion: Session = Depends(obtener_sesion),
):
    usuario = auth_servicio.autenticar(sesion, datos)
    respuesta.set_cookie(
        key=configuracion.nombre_cookie,
        value=crear_token(usuario.id),
        max_age=configuracion.minutos_sesion * 60,
        httponly=True,
        samesite="lax",
        path="/",
    )
    return usuario


@router.get("/yo", response_model=UsuarioSalida)
def yo(usuario: Usuario = Depends(obtener_usuario_actual)):
    return usuario


@router.post("/salir", response_model=MensajeSalida)
def salir(respuesta: Response):
    respuesta.delete_cookie(key=configuracion.nombre_cookie, path="/")
    return {"mensaje": "Sesión cerrada"}


@router.post("/recuperar", response_model=RecuperarSalida)
def recuperar(datos: RecuperarEntrada, sesion: Session = Depends(obtener_sesion)):
    codigo = auth_servicio.solicitar_recuperacion(sesion, datos.correo)
    return {
        "mensaje": "Si el correo existe, se generó un código de recuperación",
        "codigo": codigo,
    }


@router.post("/cambiar-contrasena", response_model=MensajeSalida)
def cambiar_contrasena(
    datos: CambioContrasenaEntrada, sesion: Session = Depends(obtener_sesion)
):
    auth_servicio.cambiar_contrasena(sesion, datos)
    return {"mensaje": "Contraseña actualizada"}