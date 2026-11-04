from datetime import date, timedelta

from app.schemas.mascota import MascotaActualizada, MascotaEntrada
from app.services import historial_servicio, mascota_servicio


def test_operaciones_de_mascota_crean_historial(session, usuario):
    mascota = mascota_servicio.crear_mascota(
        session,
        MascotaEntrada(
            nombre="Luna",
            sexo="Hembra",
            especie="perro",
            cuidado="vacuna",
            fecha_cuidado=date.today() + timedelta(days=3),
        ),
        usuario.id,
    )

    mascota_servicio.actualizar_mascota(
        session,
        mascota.id,
        MascotaActualizada(
            nombre="Luna actualizada",
            sexo="Hembra",
            especie="perro",
            cuidado="control",
        ),
        usuario.id,
    )
    mascota_servicio.reprogramar_cuidado(
        session,
        mascota.id,
        usuario.id,
        date.today() + timedelta(days=10),
        "El veterinario no atiende ese día",
    )
    mascota_servicio.eliminar_mascota(session, mascota.id, usuario.id)

    historial = historial_servicio.listar_por_usuario(session, usuario.id)

    assert [registro.tipo_accion for registro in reversed(historial)] == [
        "crear",
        "actualizar",
        "reprogramar",
        "eliminar",
    ]
    assert all(registro.mascota_id == mascota.id for registro in historial)