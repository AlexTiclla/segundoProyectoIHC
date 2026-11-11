from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PropiedadesEvento(BaseModel):
    model_config = ConfigDict(extra="forbid")

    recurrente: bool | None = None


class EventoEntrada(BaseModel):
    model_config = ConfigDict(extra="forbid")

    evento: Literal[
        "cuidado_abierto",
        "cuidado_completado"
    ]

    flujo_id: UUID

    props: PropiedadesEvento = Field(
        default_factory=PropiedadesEvento
    )


class EventoSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    evento: str
    fecha: datetime


class ResumenAnalitica(BaseModel):
    iniciados: int
    completados: int
    porcentaje: float