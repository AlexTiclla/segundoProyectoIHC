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

class MascotaSalida(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    sexo: str
    especie: str
    cuidado: str
    fecha_cuidado:date
    estado:str
    usuario_id:int  
    responsable_nombre: str | None = None
    intervalo_cantidad: int | None = None
    intervalo_unidad: str | None = None
    proxima_fecha: date | None = None

class ResponsableEntrada(BaseModel):
    correo: str