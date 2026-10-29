from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from typing import Literal
from app.base_datos import obtener_sesion
from app.dependencias import obtener_usuario_actual
from app.models.usuario import Usuario
from app.schemas.mascota import MascotaEntrada, MascotaActualizada, MascotaSalida, MascotaReprogramar, ResponsableEntrada
from app.services import mascota_servicio 

router = APIRouter(prefix = "/mascotas", tags = ["Mascotas"])

@router.post("", response_model=MascotaSalida, status_code=201)
def crear(datos: MascotaEntrada,sesion: Session = Depends(obtener_sesion),usuario: Usuario = Depends(obtener_usuario_actual)):
    return mascota_servicio.crear_mascota(sesion,datos,usuario.id)


@router.get("", response_model=list[MascotaSalida])
def listar(sesion: Session = Depends(obtener_sesion),usuario: Usuario = Depends(obtener_usuario_actual)):
    return mascota_servicio.listar_mascotas(sesion,usuario.id)

@router.get("/filtrar", response_model=list[MascotaSalida])
def filtrar(nombre:str|None=None,estado:Literal["pendiente","realizado"]| None = None, tipo_cuidado:str|None=None,fecha_desde:date|None=None,fecha_hasta:date|None=None,session:Session=Depends(obtener_sesion),usuario:Usuario=Depends(obtener_usuario_actual)):
    return mascota_servicio.filtrar_mascotas(session,usuario.id,nombre,estado,tipo_cuidado,fecha_desde,fecha_hasta)

@router.get("/{mascota_id}", response_model=MascotaSalida)
def obtener(mascota_id: int, sesion:Session=Depends(obtener_sesion), usuario:Usuario=Depends(obtener_usuario_actual)):
    return mascota_servicio.obtener_propia(sesion,mascota_id,usuario.id)


@router.put("/{mascota_id}", response_model=MascotaSalida)
def actualizar(mascota_id: int, datos: MascotaActualizada, sesion:Session=Depends(obtener_sesion), usuario:Usuario=Depends(obtener_usuario_actual)):
    return mascota_servicio.actualizar_mascota(sesion,mascota_id,datos,usuario.id)


@router.delete("/{mascota_id}", status_code=204)
def eliminar(mascota_id: int, sesion:Session=Depends(obtener_sesion), usuario:Usuario=Depends(obtener_usuario_actual)):
    mascota_servicio.eliminar_mascota(sesion,mascota_id,usuario.id)

@router.patch("/{mascota_id}/realizar", response_model=MascotaSalida)
def realizar(mascota_id:int,sesion:Session=Depends(obtener_sesion), usuario:Usuario=Depends(obtener_usuario_actual)):
    return mascota_servicio.marcar_realizado(sesion,mascota_id,usuario.id)

@router.patch("/{mascota_id}/reprogramar", response_model=MascotaSalida)
def reprogramar(mascota_id:int,dato_fecha:MascotaReprogramar,sesion:Session = Depends(obtener_sesion),usuario:Usuario=Depends(obtener_usuario_actual)):
    nueva_fecha = dato_fecha.fecha_cuidado
    return mascota_servicio.reprogramar_cuidado(sesion,mascota_id,usuario.id,nueva_fecha)

@router.patch("/{mascota_id}/responsable", response_model=MascotaSalida)
def asignar_responsable(
    mascota_id: int,
    datos: ResponsableEntrada,
    sesion: Session = Depends(obtener_sesion),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    return mascota_servicio.asignar_responsable(
        sesion,
        mascota_id,
        datos.correo,
        usuario.id
    )