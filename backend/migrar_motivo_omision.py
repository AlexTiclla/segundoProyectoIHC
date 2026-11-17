from pathlib import Path
from shutil import copy2
from sqlalchemy import inspect, text
from app.base_datos import motor

if motor.dialect.name != "sqlite":
    raise SystemExit("ERROR: La base configurada no es SQLite.")

ruta = Path(motor.url.database).resolve()

if not ruta.is_file():
    raise SystemExit(f"ERROR: No existe la base de datos: {ruta}")

print("Base de datos:", ruta)

columnas = {
    columna["name"]
    for columna in inspect(motor).get_columns("mascotas")
}

if "motivo_omision" not in columnas:

    respaldo = ruta.with_name(
        f"{ruta.stem}-respaldo-tarea9{ruta.suffix}"
    )

    if not respaldo.exists():
        copy2(ruta, respaldo)
        print("Respaldo creado:", respaldo)

    with motor.begin() as conexion:
        conexion.execute(
            text(
                "ALTER TABLE mascotas ADD COLUMN motivo_omision VARCHAR(200)"
            )
        )

    print("Migracion aplicada correctamente.")

else:
    print("La columna ya existe. No se requieren cambios.")

columnas = {
    columna["name"]
    for columna in inspect(motor).get_columns("mascotas")
}

print("Columna verificada:", "motivo_omision" in columnas)
