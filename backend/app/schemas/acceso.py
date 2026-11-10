from typing import Literal

from pydantic import BaseModel, ConfigDict


class AccesoEntrada(BaseModel):
    correo: str
    permiso: Literal["consulta", "gestion"]


class AccesoSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    propietario_nombre: str
    invitado_nombre: str
    invitado_correo: str
    permiso: str
    estado: str
