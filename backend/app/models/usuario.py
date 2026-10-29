from datetime import datetime
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.base_datos import Base
from app.utilidades import ahora_utc

class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre_completo:Mapped[str] = mapped_column(String(120))
    correo: Mapped[str] = mapped_column(String(120),unique=True,index=True)
    contrasena_hash: Mapped[str] = mapped_column(String(100))
    codigo_recuperacion_hash: Mapped[str|None] = mapped_column(String(100),default=None)
    codigo_expira_en: Mapped[datetime|None] = mapped_column(default=None)
    creado_en: Mapped[datetime] = mapped_column(default=ahora_utc)

    # relacion
    mascotas = relationship(
        "Mascota",
        back_populates="usuario",
        foreign_keys="Mascota.usuario_id"
    )
    historial = relationship("Historial",back_populates="usuario") 