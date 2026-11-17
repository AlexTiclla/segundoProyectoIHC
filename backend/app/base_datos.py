from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import configuracion

es_sqlite = configuracion.url_base_datos.startswith("sqlite")

# SQLite: esperar hasta 30 s si otra conexión está escribiendo, en vez de fallar con "database is locked"
argumentos = {"timeout": 30} if es_sqlite else {}
motor = create_engine(configuracion.url_base_datos,pool_pre_ping=True,connect_args=argumentos)
sesionLocal = sessionmaker(bind=motor, autoflush=False)

# SQLite: el modo WAL deja leer mientras otra conexión escribe (varias pruebas e2e a la vez)
if es_sqlite:
    @event.listens_for(motor, "connect")
    def activar_wal(conexion, registro):
        conexion.execute("PRAGMA journal_mode=WAL")

class Base(DeclarativeBase):
    pass

def obtener_sesion():
    sesion =sesionLocal()
    try:
        yield sesion
    finally:
        sesion.close()
