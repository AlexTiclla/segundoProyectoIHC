from datetime import datetime
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.base_datos import Base
from app.utilidades import ahora_utc

CONSULTA = "consulta"
GESTION = "gestion"

PENDIENTE = "pendiente"
ACEPTADO = "aceptado"
RECHAZADO = "rechazado"
REVOCADO = "revocado"

# El propietario comparte todos sus cuidados con otra cuenta.
# Cada invitación es una fila: al revocar o rechazar no se borra, solo cambia su estado.
class Acceso(Base):
    __tablename__ = "accesos"
    id: Mapped[int] = mapped_column(primary_key=True)
    propietario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    invitado_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    permiso: Mapped[str] = mapped_column(String(10))
    estado: Mapped[str] = mapped_column(String(10), default=PENDIENTE)
    creado_en: Mapped[datetime] = mapped_column(default=ahora_utc)

    propietario = relationship("Usuario", foreign_keys=[propietario_id])
    invitado = relationship("Usuario", foreign_keys=[invitado_id])

    @property
    def propietario_nombre(self):
        return self.propietario.nombre_completo

    @property
    def invitado_nombre(self):
        return self.invitado.nombre_completo

    @property
    def invitado_correo(self):
        return self.invitado.correo
