
import sqlite3
import sys
from datetime import date, timedelta

# Recibimos el ID desde la terminal
id_mascota = int(sys.argv[1])

# Calculamos la fecha de ayer
fecha_ayer = (date.today() - timedelta(days=1)).isoformat()

with sqlite3.connect("mascotas.db") as conexion:
    cursor = conexion.execute(
        """
        UPDATE mascotas
        SET fecha_cuidado = ?
        WHERE id = ?
          AND estado = 'pendiente'
          AND eliminada = 0
        """,
        (fecha_ayer, id_mascota)
    )

    if cursor.rowcount != 1:
        raise ValueError(
            "No existe una mascota pendiente con ese ID"
        )

print("Mascota de prueba actualizada")
print("ID:", id_mascota)
print("Fecha:", fecha_ayer)
