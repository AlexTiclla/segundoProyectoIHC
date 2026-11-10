from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.base_datos import obtener_sesion
from app.dependencias import obtener_usuario_actual
from app.models.usuario import Usuario
from app.schemas.acceso import AccesoEntrada, AccesoSalida
from app.services import acceso_servicio

router = APIRouter(prefix="/accesos", tags=["Accesos"])

@router.post("", response_model=AccesoSalida, status_code=201)
def invitar(datos: AccesoEntrada, sesion: Session = Depends(obtener_sesion), usuario: Usuario = Depends(obtener_usuario_actual)):
    return acceso_servicio.invitar(sesion, usuario.id, datos.correo, datos.permiso)

@router.get("/enviados", response_model=list[AccesoSalida])
def enviados(sesion: Session = Depends(obtener_sesion), usuario: Usuario = Depends(obtener_usuario_actual)):
    return acceso_servicio.enviados(sesion, usuario.id)

@router.get("/recibidos", response_model=list[AccesoSalida])
def recibidos(sesion: Session = Depends(obtener_sesion), usuario: Usuario = Depends(obtener_usuario_actual)):
    return acceso_servicio.recibidos(sesion, usuario.id)

@router.patch("/{acceso_id}/aceptar", response_model=AccesoSalida)
def aceptar(acceso_id: int, sesion: Session = Depends(obtener_sesion), usuario: Usuario = Depends(obtener_usuario_actual)):
    return acceso_servicio.responder(sesion, acceso_id, usuario.id, True)

@router.patch("/{acceso_id}/rechazar", response_model=AccesoSalida)
def rechazar(acceso_id: int, sesion: Session = Depends(obtener_sesion), usuario: Usuario = Depends(obtener_usuario_actual)):
    return acceso_servicio.responder(sesion, acceso_id, usuario.id, False)

@router.patch("/{acceso_id}/revocar", response_model=AccesoSalida)
def revocar(acceso_id: int, sesion: Session = Depends(obtener_sesion), usuario: Usuario = Depends(obtener_usuario_actual)):
    return acceso_servicio.revocar(sesion, acceso_id, usuario.id)
