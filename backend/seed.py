"""Seed de demostración para Mascota al Día (Tarea 9).

Guardar como: backend/seed.py
Ejecutar desde backend/: python seed.py --usuario-id 1
Verificar:            python seed.py --usuario-id 1 --verificar

Crea 8 mascotas distintas con 8 cuidados cada una (64 registros).
Solo escribe en SQLite; genera respaldo antes de insertar; no borra datos;
no duplica los escenarios ya insertados aunque se modifique su estado.
"""

from __future__ import annotations

import argparse
import os
import sqlite3
from collections import Counter
from datetime import date, datetime, timedelta
from pathlib import Path

# La URL SQLite del proyecto se resuelve respecto a la carpeta backend.
BACKEND = Path(__file__).resolve().parent
os.chdir(BACKEND)

from sqlalchemy import inspect, select  # noqa: E402

from app.base_datos import motor, sesionLocal  # noqa: E402
from app.models.historial import Historial  # noqa: E402
from app.models.mascota import Mascota  # noqa: E402
from app.models.reprogramacion import Reprogramacion  # noqa: E402
from app.models.usuario import Usuario  # noqa: E402

MARCA = "[SEED-T9-V2]"
PREFIJO = "Demo T9 - "

# En este proyecto, cada fila de 'mascotas' es un CUIDADO de una mascota;
# por eso se repite el nombre del animal en diferentes cuidados.
ANIMALES = (
    ("Luna", "Perro", "Hembra"),
    ("Simba", "Gato", "Macho"),
    ("Copito", "Conejo", "Macho"),
    ("Kiwi", "Ave", "Hembra"),
    ("Rocky", "Perro", "Macho"),
    ("Misha", "Gato", "Hembra"),
    ("Nube", "Conejo", "Hembra"),
    ("Paco", "Ave", "Macho"),
)

# Los nombres son exactamente los valores de frontend/lib/constantes.ts.
CUIDADOS = (
    "Vacuna", "Control", "Medicamento", "Desparasitación",
    "Baño", "Corte de uñas", "Limpieza dental",
)

MOTIVOS = (
    "La clínica veterinaria estaba cerrada.",
    "No había transporte para asistir a la cita.",
    "La mascota no pudo salir de casa.",
    "No se consiguió el medicamento a tiempo.",
    "El responsable tuvo un imprevisto.",
    "La atención veterinaria fue suspendida.",
    "No había disponibilidad para la consulta.",
    "Se omitió por recomendación veterinaria.",
)

ESCENARIOS = (
    "vencido",
    "vencido_recurrente",
    "hoy",
    "futuro",
    "realizado",
    "realizado_tarde",
    "omitido",
    "reprogramado",
)


def comprobar_base() -> Path:
    """Se niega a escribir en producción/PostgreSQL o SQLite inexistente."""
    if motor.dialect.name != "sqlite":
        raise SystemExit("ERROR: seed solo para SQLite. Revisa URL_BASE_DATOS en backend/.env")
    ruta = motor.url.database
    if not ruta or ruta == ":memory:":
        raise SystemExit("ERROR: configura un archivo SQLite en backend/.env")
    db = Path(ruta).resolve()
    if not db.is_file():
        raise SystemExit(f"ERROR: no existe SQLite en {db}. Ejecuta el backend primero.")

    inspector = inspect(motor)
    for tabla in ("usuarios", "mascotas", "historial", "reprogramaciones"):
        if not inspector.has_table(tabla):
            raise SystemExit(f"ERROR: falta la tabla '{tabla}' en {db}")
    columnas = {c["name"] for c in inspector.get_columns("mascotas")}
    if "motivo_omision" not in columnas or not hasattr(Mascota, "motivo_omision"):
        raise SystemExit(
            "ERROR: falta motivo_omision en SQLite o en app/models/mascota.py. "
            "Usa el backend actualizado de la Tarea 9."
        )
    return db


def copia_seguridad(db: Path) -> Path:
    destino = db.with_name(
        f"{db.stem}.backup-seed-{datetime.now():%Y%m%d-%H%M%S-%f}.db"
    )
    with sqlite3.connect(db) as origen, sqlite3.connect(destino) as copia:
        origen.backup(copia)
    return destino


def configuracion_escenario(tipo: str, indice: int, hoy: date) -> dict:
    """Estados y fechas coherentes con el negocio y con la recurrencia."""
    if tipo == "vencido":
        return dict(fecha=hoy - timedelta(days=2 + indice), estado="pendiente")
    if tipo == "vencido_recurrente":
        cantidad, unidad = ((7, "dias"), (1, "meses"), (14, "dias"))[indice % 3]
        return dict(
            fecha=hoy - timedelta(days=9 + indice), estado="pendiente",
            intervalo_cantidad=cantidad, intervalo_unidad=unidad,
        )
    if tipo == "hoy":
        return dict(fecha=hoy, estado="pendiente")
    if tipo == "futuro":
        return dict(
            fecha=hoy + timedelta(days=3 + indice), estado="pendiente",
            intervalo_cantidad=1 if indice % 2 == 0 else None,
            intervalo_unidad="meses" if indice % 2 == 0 else None,
        )
    if tipo == "realizado":
        fecha = hoy - timedelta(days=3 + indice)
        return dict(fecha=fecha, estado="realizado", realizado_en=fecha)
    if tipo == "realizado_tarde":
        return dict(
            fecha=hoy - timedelta(days=12 + indice),
            estado="realizado", realizado_en=hoy - timedelta(days=1),
        )
    if tipo == "omitido":
        return dict(
            fecha=hoy - timedelta(days=5 + indice),
            estado="omitido", motivo_omision=MOTIVOS[indice],
        )
    if tipo == "reprogramado":
        return dict(
            fecha=hoy + timedelta(days=10 + indice),
            estado="pendiente", intervalo_cantidad=14,
            intervalo_unidad="dias",
        )
    raise ValueError(f"Escenario no soportado: {tipo}")


def estado_actual(sesion, usuario_id: int) -> None:
    registros = sesion.scalars(
        select(Mascota).where(
            Mascota.usuario_id == usuario_id,
            Mascota.eliminada.is_(False),
            Mascota.nombre.like(f"{PREFIJO}%"),
        )
    ).all()
    animales = sorted({m.nombre for m in registros})
    estados = Counter(
        "vencido" if m.estado == "pendiente" and m.fecha_cuidado < date.today()
        else m.estado for m in registros
    )
    print("\n========== RESULTADO EN SQLITE ==========")
    print(f"Mascotas DEMO distintas: {len(animales)}")
    print(f"Cuidados DEMO visibles: {len(registros)}")
    for nombre in animales:
        print(f"  - {nombre}")
    print("Estados actuales:")
    for tipo, cantidad in sorted(estados.items()):
        print(f"  {tipo:12} {cantidad}")
    print("=========================================")


def ejecutar(usuario_id: int, verificar: bool) -> None:
    db = comprobar_base()
    print(f"Base utilizada: {db}")

    with sesionLocal() as sesion:
        usuario = sesion.get(Usuario, usuario_id)
        if usuario is None:
            raise SystemExit(
                f"ERROR: usuario {usuario_id} inexistente. "
                "Consulta GET /auth/yo en Swagger para ver tu ID."
            )
        print(f"Propietario: {usuario.nombre_completo} (ID {usuario.id})")
        if verificar:
            estado_actual(sesion, usuario_id)
            return
        anteriores = set(sesion.scalars(
            select(Historial.descripcion).where(
                Historial.usuario_id == usuario_id,
                Historial.descripcion.like(f"{MARCA}%"),
            )
        ).all())

    print(f"Respaldo creado: {copia_seguridad(db)}")
    creados = Counter()
    ya_existian = 0
    hoy = date.today()

    with sesionLocal() as sesion:
        try:
            for indice, (nombre, especie, sexo) in enumerate(ANIMALES):
                for posicion, escenario in enumerate(ESCENARIOS):
                    identificador = f"{MARCA} {indice + 1:02}/{escenario}"
                    if any(d.startswith(identificador + " ") for d in anteriores):
                        ya_existian += 1
                        continue

                    valores = configuracion_escenario(escenario, indice, hoy)
                    fecha = valores["fecha"]
                    estado = valores["estado"]
                    mascota = Mascota(
                        nombre=f"{PREFIJO}{nombre}",
                        especie=especie,
                        sexo=sexo,
                        cuidado=CUIDADOS[(indice * 3 + posicion) % len(CUIDADOS)],
                        fecha_cuidado=fecha,
                        estado=estado,
                        eliminada=False,
                        usuario_id=usuario_id,
                        responsable_id=usuario_id if indice % 3 == 0 else None,
                        intervalo_cantidad=valores.get("intervalo_cantidad"),
                        intervalo_unidad=valores.get("intervalo_unidad"),
                        realizado_por_id=usuario_id if estado == "realizado" else None,
                        realizado_en=valores.get("realizado_en"),
                        motivo_omision=valores.get("motivo_omision"),
                    )
                    sesion.add(mascota)
                    sesion.flush()
                    sesion.add(Historial(
                        tipo_accion="crear",
                        descripcion=f"{identificador} Cuidado de demostración.",
                        usuario_id=usuario_id,
                        mascota_id=mascota.id,
                    ))
                    if estado == "realizado":
                        sesion.add(Historial(
                            tipo_accion="realizar",
                            descripcion=f"[DEMO] Se realizó el cuidado de {nombre}.",
                            usuario_id=usuario_id,
                            mascota_id=mascota.id,
                        ))
                    elif estado == "omitido":
                        sesion.add(Historial(
                            tipo_accion="omitir",
                            descripcion=f"[DEMO] {valores['motivo_omision']}",
                            usuario_id=usuario_id,
                            mascota_id=mascota.id,
                        ))
                    elif escenario == "reprogramado":
                        fecha_previa = fecha - timedelta(days=4)
                        alcance = "solo_esta" if indice % 2 == 0 else "futuras"
                        mascota.fecha_base = fecha_previa if alcance == "solo_esta" else fecha
                        sesion.add(Reprogramacion(
                            mascota_id=mascota.id,
                            fecha_anterior=fecha_previa,
                            fecha_nueva=fecha,
                            diferencia_dias=4,
                            motivo="[DEMO] Cambio de fecha para la presentación.",
                            alcance=alcance,
                        ))
                        sesion.add(Historial(
                            tipo_accion="reprogramar",
                            descripcion=f"[DEMO] Cuidado reprogramado de {nombre}.",
                            usuario_id=usuario_id,
                            mascota_id=mascota.id,
                        ))
                    creados[escenario] += 1
            sesion.commit()
        except Exception:
            sesion.rollback()
            raise

        print("\n========== CARGA FINALIZADA ==========")
        for escenario in ESCENARIOS:
            print(f"  {escenario:22} +{creados[escenario]}")
        print(f"TOTAL CREADOS: {sum(creados.values())}")
        print(f"YA EXISTIAN: {ya_existian}")
        estado_actual(sesion, usuario_id)
    print("\nEn /inicio selecciona Estado: Todos y Fecha: Todas.")
    print("Busca 'Demo T9' para ver las 8 mascotas y sus cuidados.")
    print("El seed no altera las mascotas anteriores ni los eventos de analítica.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Crear 8 mascotas con 64 cuidados de prueba")
    parser.add_argument("--usuario-id", type=int, default=1)
    parser.add_argument("--verificar", action="store_true", help="Solo consultar, sin escribir")
    opciones = parser.parse_args()
    ejecutar(opciones.usuario_id, opciones.verificar)
