from pathlib import Path
from contextlib import closing
from datetime import datetime
import sqlite3
from sqlalchemy import inspect, text
from app.base_datos import motor

if motor.dialect.name != "sqlite":
    raise SystemExit("ERROR: La base configurada no es SQLite.")

ruta = Path(motor.url.database).resolve()

if not ruta.is_file():
    raise SystemExit(f"ERROR: No existe la base: {ruta}")

print("Base de datos:", ruta)

columnas = {
    c["name"] for c in inspect(motor).get_columns("usuarios")
}

faltantes = {"eliminado", "eliminado_en"} - columnas

if faltantes:
    respaldo = ruta.with_name(
        f"{ruta.stem}-respaldo-tarea10-"
        f"{datetime.now():%Y%m%d-%H%M%S}{ruta.suffix}"
    )

    with closing(sqlite3.connect(str(ruta))) as origen:
        with closing(sqlite3.connect(str(respaldo))) as destino:
            origen.backup(destino)

    print("Respaldo creado:", respaldo)

    with motor.begin() as conexion:
        if "eliminado" in faltantes:
            conexion.execute(text(
                "ALTER TABLE usuarios "
                "ADD COLUMN eliminado BOOLEAN NOT NULL DEFAULT 0"
            ))
            print("Columna eliminado agregada.")

        if "eliminado_en" in faltantes:
            conexion.execute(text(
                "ALTER TABLE usuarios ADD COLUMN eliminado_en DATETIME"
            ))
            print("Columna eliminado_en agregada.")
else:
    print("La base ya tiene ambas columnas.")

columnas = {
    c["name"] for c in inspect(motor).get_columns("usuarios")
}

print("eliminado:", "eliminado" in columnas)
print("eliminado_en:", "eliminado_en" in columnas)
print("Migracion Tarea 10 finalizada.")
