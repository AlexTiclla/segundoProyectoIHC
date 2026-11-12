from datetime import date
from sqlalchemy import String,Date,ForeignKey,Boolean,Integer
from sqlalchemy.orm import Mapped, mapped_column,relationship
from app.base_datos import Base
from app.models.reprogramacion import Reprogramacion
from app.recurrencia import fechas_siguientes

PENDIENTE = "pendiente"
REALIZADO = "realizado" 
OMITIDO = "omitido"

class Mascota(Base):
    __tablename__ = "mascotas"
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    sexo: Mapped[str] = mapped_column(String(7))
    especie: Mapped[str] = mapped_column(String(50))
    cuidado: Mapped[str] = mapped_column(String(100))
    fecha_cuidado: Mapped[date] = mapped_column(Date)
    estado: Mapped[str] = mapped_column(String(20),default=PENDIENTE)
    eliminada: Mapped[bool] = mapped_column(Boolean, default=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    responsable_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=True
    )
    # Cada cuánto se repite el cuidado. Sin valores, no se repite.
    intervalo_cantidad: Mapped[int | None] = mapped_column(Integer, nullable=True)
    intervalo_unidad: Mapped[str | None] = mapped_column(String(10), nullable=True)
    # Desde dónde se cuentan las siguientes ocurrencias. Vacía: desde fecha_cuidado.
    fecha_base: Mapped[date | None] = mapped_column(Date, nullable=True)
    # Quién la marcó como realizada y cuándo. Se conserva aunque luego se revoque su acceso.
    realizado_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    realizado_en: Mapped[date | None] = mapped_column(Date, nullable=True)
    motivo_omision: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True
    )
    # Qué puede hacer con ella quien la consulta. El servicio lo fija por cada consulta.
    permiso = "propietario"
    # relacion
    usuario = relationship(
        "Usuario",
        back_populates="mascotas",
        foreign_keys=[usuario_id]
    )

    responsable = relationship(
        "Usuario",
        foreign_keys=[responsable_id]
    )
    realizado_por = relationship("Usuario", foreign_keys=[realizado_por_id])
    historial=relationship("Historial", back_populates="mascota")
    reprogramaciones = relationship(Reprogramacion, order_by=Reprogramacion.id)
    @property
    def responsable_nombre(self):
        return self.responsable.nombre_completo if self.responsable else None

    @property
    def propietario_nombre(self):
        return self.usuario.nombre_completo

    @property
    def realizado_por_nombre(self):
        return self.realizado_por.nombre_completo if self.realizado_por else None

    # La fecha que tenía antes de la primera reprogramación
    @property
    def fecha_original(self) -> date:
        return self.reprogramaciones[0].fecha_anterior if self.reprogramaciones else self.fecha_cuidado

    # Las siguientes ocurrencias: se calculan, no se guardan hasta que les toca
    @property
    def proximas_fechas(self) -> list[date]:
        if self.estado != PENDIENTE or not self.intervalo_cantidad or not self.intervalo_unidad:
            return []
        return fechas_siguientes(
            self.fecha_base or self.fecha_cuidado,
            max(self.fecha_cuidado, date.today()),
            self.intervalo_cantidad,
            self.intervalo_unidad,
        )

    # La fecha del siguiente cuidado si se marca como realizado hoy
    @property
    def proxima_fecha(self) -> date | None:
        fechas = self.proximas_fechas
        return fechas[0] if fechas else None
    # FUNCION PARA PONER COMO VENCIDO UN CUIDADO
    @property
    def vencido(self) -> bool:
        return (
            self.estado == PENDIENTE
            and self.fecha_cuidado < date.today()
            and not self.eliminada
        )