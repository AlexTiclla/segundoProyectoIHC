import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import date, timedelta
from sqlalchemy import func, select
from app.base_datos import Base, motor, sesionLocal 
from app.models.historial import Historial
from app.models.mascota import Mascota, PENDIENTE, REALIZADO
from app.models.usuario import Usuario


PRIMER_CUIDADO_SEMILLA = "Se creó la mascota 'Max' para Michael Braun."


def registrar_historial(
    session,
    tipo_accion: str,
    descripcion: str,
    usuario_id: int,
    mascota_id: int,
) -> None:
    session.add(
        Historial(
            tipo_accion=tipo_accion,
            descripcion=descripcion,
            usuario_id=usuario_id,
            mascota_id=mascota_id,
        )
    )


def crear_cuidado(
    session,
    usuario_id: int,
    nombre: str,
    sexo: str,
    especie: str,
    cuidado: str,
    fecha_cuidado: date,
    estado: str = PENDIENTE,
    eliminada: bool = False,
    intervalo_cantidad: int | None = None,
    intervalo_unidad: str | None = None,
) -> Mascota:
    mascota = Mascota(
        nombre=nombre,
        sexo=sexo,
        especie=especie,
        cuidado=cuidado,
        fecha_cuidado=fecha_cuidado,
        estado=estado,
        eliminada=eliminada,
        usuario_id=usuario_id,
        intervalo_cantidad=intervalo_cantidad,
        intervalo_unidad=intervalo_unidad,
    )
    session.add(mascota)
    session.flush()
    registrar_historial(
        session,
        "crear",
        f"Se creó la mascota '{mascota.nombre}' para Michael Braun.",
        usuario_id,
        mascota.id,
    )
    return mascota


def ejecutar_semilla() -> None:
    Base.metadata.create_all(bind=motor)

    with sesionLocal.begin() as session:
        usuario = session.scalar(
            select(Usuario).where(
                func.lower(Usuario.nombre_completo) == "michael braun"
            )
        )
        if usuario is None:
            raise RuntimeError(
                "No se encontró un usuario llamado Michael Braun. "
                "La semilla no creó ningún usuario."
            )

        ya_cargada = session.scalar(
            select(Historial.id)
            .where(
                Historial.usuario_id == usuario.id,
                Historial.tipo_accion == "crear",
                Historial.descripcion == PRIMER_CUIDADO_SEMILLA,
            )
            .limit(1)
        )
        if ya_cargada is not None:
            print("La semilla de Michael Braun ya estaba cargada.")
            return

        hoy = date.today()
        creados: list[Mascota] = []

        # Cinco cuidados realizados, incluyendo fechas pasadas.
        datos = [
            ("Max", "Macho", "perro", "vacuna", hoy - timedelta(days=20), REALIZADO),
            ("Luna", "Hembra", "gato", "desparasitación", hoy - timedelta(days=12), REALIZADO),
            ("Rocky", "Macho", "perro", "control veterinario", hoy - timedelta(days=5), REALIZADO),
            ("Nala", "Hembra", "gato", "baño", hoy + timedelta(days=2), REALIZADO),
            ("Toby", "Macho", "conejo", "corte de uñas", hoy - timedelta(days=2), REALIZADO),
        ]
        for nombre, sexo, especie, cuidado, fecha, estado in datos:
            mascota = crear_cuidado(
                session, usuario.id, nombre, sexo, especie, cuidado, fecha, estado
            )
            creados.append(mascota)
            registrar_historial(
                session,
                "realizar",
                f"Se marcó como realizado el cuidado de '{nombre}'.",
                usuario.id,
                mascota.id,
            )

        # Cinco pendientes con fecha futura.
        # Tres de ellos son recurrentes: al realizarlos se programa el siguiente.
        datos = [
            ("Milo", "Macho", "perro", "vacuna", 4, 1, "anios"),
            ("Mia", "Hembra", "gato", "control veterinario", 7, None, None),
            ("Simba", "Macho", "gato", "desparasitación", 10, 3, "meses"),
            ("Kira", "Hembra", "perro", "baño", 14, 7, "dias"),
            ("Bruno", "Macho", "conejo", "corte de uñas", 21, None, None),
        ]
        for nombre, sexo, especie, cuidado, dias, cantidad, unidad in datos:
            creados.append(
                crear_cuidado(
                    session,
                    usuario.id,
                    nombre,
                    sexo,
                    especie,
                    cuidado,
                    hoy + timedelta(days=dias),
                    intervalo_cantidad=cantidad,
                    intervalo_unidad=unidad,
                )
            )

        # Cuatro pendientes atrasados para probar el estado visual de vencido.
        datos = [
            ("Coco", "Hembra", "perro", "limpieza dental", 3),
            ("Doki", "Macho", "gato", "vacuna", 8),
            ("Mora", "Hembra", "perro", "control veterinario", 15),
            ("Pancho", "Macho", "conejo", "desparasitación", 25),
        ]
        for nombre, sexo, especie, cuidado, dias_atras in datos:
            creados.append(
                crear_cuidado(
                    session,
                    usuario.id,
                    nombre,
                    sexo,
                    especie,
                    cuidado,
                    hoy - timedelta(days=dias_atras),
                )
            )

        # Tres registros editados: se conserva la creación y se registra la
        # actualización con los valores finales.
        datos = [
            ("Maya", "Hembra", "perro", "baño", "control veterinario", 6),
            ("Otto", "Macho", "gato", "vacuna", "desparasitación", 9),
            ("Zoe", "Hembra", "conejo", "corte de uñas", "limpieza dental", 12),
        ]
        for nombre, sexo, especie, cuidado_anterior, cuidado, dias in datos:
            mascota = crear_cuidado(
                session,
                usuario.id,
                nombre,
                sexo,
                especie,
                cuidado_anterior,
                hoy + timedelta(days=dias),
            )
            mascota.cuidado = cuidado
            mascota.nombre = f"{nombre} actualizado"
            registrar_historial(
                session,
                "actualizar",
                f"Se actualizó la mascota '{mascota.nombre}' con los nuevos datos.",
                usuario.id,
                mascota.id,
            )
            creados.append(mascota)

        # Tres eliminados: permanecen en la base para que el historial conserve
        # la acción, pero no aparecen en el listado de mascotas.
        datos = [
            ("Pecas", "Hembra", "perro", "vacuna", 3),
            ("Felix", "Macho", "gato", "baño", 11),
            ("Bimba", "Hembra", "conejo", "control veterinario", 18),
        ]
        for nombre, sexo, especie, cuidado, dias in datos:
            mascota = crear_cuidado(
                session,
                usuario.id,
                nombre,
                sexo,
                especie,
                cuidado,
                hoy + timedelta(days=dias),
                eliminada=True,
            )
            registrar_historial(
                session,
                "eliminar",
                f"Se eliminó la mascota '{nombre}'.",
                usuario.id,
                mascota.id,
            )
            creados.append(mascota)

        # Una reprogramación adicional deja cubierto el flujo de cambio de fecha.
        reprogramada = creados[5]
        fecha_anterior = reprogramada.fecha_cuidado
        reprogramada.fecha_cuidado = hoy + timedelta(days=30)
        registrar_historial(
            session,
            "reprogramar",
            f"Se reprogramó el cuidado de '{reprogramada.nombre}' "
            f"del {fecha_anterior.isoformat()} al "
            f"{reprogramada.fecha_cuidado.isoformat()}.",
            usuario.id,
            reprogramada.id,
        )

        print(
            "Semilla cargada: 20 cuidados para Michael Braun "
            "(5 realizados, 12 pendientes y 3 eliminados)."
        )


if __name__ == "__main__":
    ejecutar_semilla()