from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.acceso import AccesoSalida
from app.schemas.historial import HistorialResponse
from app.schemas.mascota import MascotaSalida


class PerfilSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre_completo: str
    correo: str
    creado_en: datetime


class MisDatosSalida(BaseModel):
    perfil: PerfilSalida
    mascotas: list[MascotaSalida]
    historial: list[HistorialResponse]
    accesos_otorgados: list[AccesoSalida]
    accesos_recibidos: list[AccesoSalida]
