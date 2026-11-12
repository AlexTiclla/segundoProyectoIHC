"""Pruebas Tarea 9: cuidados vencidos, omisión, permisos y recurrencia.

Guardar en backend/tests/test_cuidados_vencidos.py.
Usa la base SQLite temporal de pytest, no modifica mascotas.db.
"""

from datetime import date, timedelta

import pytest

from app.errores import ErrorDeNegocio
from app.models.acceso import Acceso
from app.repositories import mascota_repositorio as repo
from app.schemas.mascota import MascotaActualizada
from app.services import mascota_servicio as servicio


def crear_cuidado(session, usuario, dias=-1, cantidad=None, unidad=None):
    return repo.crear(
        session,
        "Luna Tarea 9",
        "Hembra",
        "Perro",
        "Vacuna",
        date.today() + timedelta(days=dias),
        usuario.id,
        cantidad,
        unidad,
    )


def exige_error(estado, operacion):
    with pytest.raises(ErrorDeNegocio) as error:
        operacion()
    assert error.value.estado == estado


def test_cuidado_vencido_se_detecta(session, usuario):
    mascota = crear_cuidado(session, usuario, dias=-2)
    assert mascota.estado == "pendiente"
    assert mascota.vencido is True


def test_cuidado_futuro_no_se_puede_omitir(session, usuario):
    mascota = crear_cuidado(session, usuario, dias=2)
    assert mascota.vencido is False
    exige_error(400, lambda: servicio.omitir_cuidado(session, mascota.id, usuario.id, "No asistí"))
    assert mascota.estado == "pendiente"


def test_omitir_exige_motivo_no_vacio(session, usuario):
    mascota = crear_cuidado(session, usuario)
    exige_error(400, lambda: servicio.omitir_cuidado(session, mascota.id, usuario.id, "   "))
    assert mascota.estado == "pendiente"


def test_omitir_guarda_motivo_y_no_duplica(session, usuario):
    mascota = crear_cuidado(session, usuario)
    omitida = servicio.omitir_cuidado(session, mascota.id, usuario.id, "  No pude asistir  ")
    assert omitida.estado == "omitido"
    assert omitida.motivo_omision == "No pude asistir"
    assert omitida.vencido is False
    assert omitida.proxima_fecha is None
    exige_error(400, lambda: servicio.omitir_cuidado(session, mascota.id, usuario.id, "Otro motivo"))
    assert len(servicio.listar_mascotas(session, usuario.id)) == 1


def test_omitir_recurrente_respetando_fecha_planificada(session, usuario):
    fecha_programada = date.today() - timedelta(days=2)
    mascota = crear_cuidado(session, usuario, dias=-2, cantidad=7, unidad="dias")
    servicio.omitir_cuidado(session, mascota.id, usuario.id, "No hubo atención")
    todos = servicio.listar_mascotas(session, usuario.id)
    pendientes = [m for m in todos if m.estado == "pendiente"]
    assert len(todos) == 2
    assert len(pendientes) == 1
    assert pendientes[0].fecha_cuidado == fecha_programada + timedelta(days=7)
    assert pendientes[0].intervalo_cantidad == 7
    assert pendientes[0].intervalo_unidad == "dias"


def test_realizado_tarde_guarda_dia_real_y_recurre(session, usuario):
    fecha_programada = date.today() - timedelta(days=2)
    mascota = crear_cuidado(session, usuario, dias=-2, cantidad=7, unidad="dias")
    realizada = servicio.marcar_realizado(session, mascota.id, usuario.id)
    assert realizada.estado == "realizado"
    assert realizada.realizado_en == date.today()
    siguientes = [m for m in servicio.listar_mascotas(session, usuario.id) if m.estado == "pendiente"]
    assert len(siguientes) == 1
    assert siguientes[0].fecha_cuidado == fecha_programada + timedelta(days=7)


def test_solo_consulta_no_puede_omitir(session, usuario, otro_usuario):
    mascota = crear_cuidado(session, usuario)
    session.add(Acceso(
        propietario_id=usuario.id,
        invitado_id=otro_usuario.id,
        permiso="consulta",
        estado="aceptado",
    ))
    session.commit()
    exige_error(403, lambda: servicio.omitir_cuidado(session, mascota.id, otro_usuario.id, "No asistí"))
    assert mascota.estado == "pendiente"


def test_no_se_puede_realizar_ni_editar_un_omitido(session, usuario):
    mascota = crear_cuidado(session, usuario)
    servicio.omitir_cuidado(session, mascota.id, usuario.id, "No asistí")
    exige_error(400, lambda: servicio.marcar_realizado(session, mascota.id, usuario.id))
    datos = MascotaActualizada(nombre="Otra", sexo="Hembra", especie="Perro", cuidado="Baño")
    exige_error(400, lambda: servicio.actualizar_mascota(session, mascota.id, datos, usuario.id))
    exige_error(400, lambda: servicio.reprogramar_cuidado(
        session, mascota.id, usuario.id, date.today() + timedelta(days=5), "Cambiar fecha"
    ))
