from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict,Field

UnidadIntervalo = Literal["dias", "meses", "anios"]

class MascotaEntrada(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nombre: str = Field(min_length=1,max_length=120)
    sexo: Literal["Macho", "Hembra"]
    especie: str = Field(min_length=1,max_length=50)
    cuidado: str = Field(min_length=1,max_length=100)
    fecha_cuidado: date
    intervalo_cantidad: int | None = None
    intervalo_unidad: UnidadIntervalo | None = None

class MascotaActualizada(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nombre:str = Field(min_length=1,max_length=120)
    sexo: Literal["Macho", "Hembra"]
    especie: str = Field(min_length=1,max_length=50)
    cuidado: str = Field(min_length=1,max_length=100)
    intervalo_cantidad: int | None = None
    intervalo_unidad: UnidadIntervalo | None = None

class MascotaReprogramar(BaseModel):
    fecha_cuidado: date
    motivo: str = Field(max_length=200)
    alcance: Literal["solo_esta", "futuras"] = "solo_esta"
#Esto es para Omitir desde el frontend para que llegue al backedn
class MascotaOmitir(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    motivo: str = Field(
        min_length=1,
        max_length=200
    )
class ReprogramacionSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    fecha_anterior: date
    fecha_nueva: date
    diferencia_dias: int
    motivo: str
    alcance: str

class MascotaSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    sexo: str
    especie: str
    cuidado: str
    fecha_cuidado:date
    estado:str
    vencido: bool
    motivo_omision: str | None = None
    usuario_id:int  
    responsable_nombre: str | None = None
    propietario_nombre: str
    permiso: str
    realizado_por_nombre: str | None = None
    realizado_en: date | None = None
    intervalo_cantidad: int | None = None
    intervalo_unidad: str | None = None
    proxima_fecha: date | None = None
    proximas_fechas: list[date] = []
    fecha_original: date
    reprogramaciones: list[ReprogramacionSalida] = []

class ResponsableEntrada(BaseModel):
    correo: str