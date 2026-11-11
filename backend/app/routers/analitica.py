from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.base_datos import obtener_sesion
from app.dependencias import obtener_usuario_actual
from app.models.evento import Evento
from app.models.usuario import Usuario
from app.schemas.evento import (
    EventoEntrada,
    EventoSalida,
    ResumenAnalitica
)


router = APIRouter(
    prefix="/analitica",
    tags=["Analitica"]
)


# Guardar un evento
@router.post(
    "/eventos",
    response_model=EventoSalida,
    status_code=201
)
def registrar_evento(
    datos: EventoEntrada,
    sesion: Session = Depends(obtener_sesion),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    nuevo = Evento(
        evento=datos.evento,
        flujo_id=str(datos.flujo_id),
        props=datos.props.model_dump(exclude_none=True)
    )

    sesion.add(nuevo)
    sesion.commit()
    sesion.refresh(nuevo)

    return nuevo


# Obtener estadísticas
@router.get(
    "/resumen",
    response_model=ResumenAnalitica
)
def obtener_resumen(
    sesion: Session = Depends(obtener_sesion),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    iniciados = sesion.scalar(
        select(func.count(func.distinct(Evento.flujo_id)))
        .where(Evento.evento == "cuidado_abierto")
    ) or 0

    flujos_iniciados = select(Evento.flujo_id).where(
        Evento.evento == "cuidado_abierto"
    )

    completados = sesion.scalar(
        select(func.count(func.distinct(Evento.flujo_id)))
        .where(
            Evento.evento == "cuidado_completado",
            Evento.flujo_id.in_(flujos_iniciados)
        )
    ) or 0

    porcentaje = (
        round(completados * 100 / iniciados, 1)
        if iniciados > 0 else 0
    )

    return {
        "iniciados": iniciados,
        "completados": completados,
        "porcentaje": porcentaje
    }