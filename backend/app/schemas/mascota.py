from datetime import date

from pydantic import BaseModel, ConfigDict,Field

class MascotaEntrada(BaseModel):
    nombre: str = Field(min_length=1,max_length=120)
    sexo: str = Field(max_length=7)
    especie: str = Field(min_length=1,max_length=50)
    cuidado: str = Field(max_length=100)
    fecha_cuidado: date

class MascotaActualizada(BaseModel):
    nombre:str = Field(min_length=1,max_length=120)
    sexo: str = Field(max_length=7)
    especie: str = Field(min_length=1,max_length=50)
    cuidado: str = Field(max_length=100)

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

class ResponsableEntrada(BaseModel):
    correo: str