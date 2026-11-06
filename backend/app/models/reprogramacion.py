from datetime import date, datetime, timezone
from sqlalchemy import String,Date,DateTime,ForeignKey,Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.base_datos import Base

SOLO_ESTA = "solo_esta"
FUTURAS = "futuras"

# Cada vez que se mueve un cuidado queda una fila: nunca se edita ni se borra.
class Reprogramacion(Base):
    __tablename__ = "reprogramaciones"
    id: Mapped[int] = mapped_column(primary_key=True)
    mascota_id: Mapped[int] = mapped_column(ForeignKey("mascotas.id"))
    fecha_anterior: Mapped[date] = mapped_column(Date)
    fecha_nueva: Mapped[date] = mapped_column(Date)
    diferencia_dias: Mapped[int] = mapped_column(Integer)
    motivo: Mapped[str] = mapped_column(String(200))
    alcance: Mapped[str] = mapped_column(String(10))
    fecha_registro: Mapped[datetime] = mapped_column(DateTime(timezone=True),default=lambda: datetime.now(timezone.utc))
