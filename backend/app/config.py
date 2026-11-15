from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Configuracion(BaseSettings):
    url_base_datos: str
    secreto_jwt: str
    minutos_sesion: int
    minutos_codigo_recuperacion: int
    nombre_cookie: str = "sesion"
    entorno: Literal["desarrollo", "produccion"] = "desarrollo"
    cookie_segura: bool = False
    recuperacion_simulada: bool = True
    zona_horaria: str = "America/La_Paz"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("zona_horaria")
    @classmethod
    def validar_zona_horaria(cls, valor: str) -> str:
        try:
            ZoneInfo(valor)
        except ZoneInfoNotFoundError as error:
            raise ValueError("ZONA_HORARIA no es una zona IANA valida") from error
        return valor

    @model_validator(mode="after")
    def validar_produccion(self):
        if self.entorno != "produccion":
            return self
        if len(self.secreto_jwt) < 32:
            raise ValueError("SECRETO_JWT debe tener al menos 32 caracteres en produccion")
        if not self.cookie_segura:
            raise ValueError("COOKIE_SEGURA debe estar activa en produccion")
        if self.recuperacion_simulada:
            raise ValueError(
                "RECUPERACION_SIMULADA debe estar desactivada en produccion"
            )
        return self

configuracion = Configuracion()
