from datetime import date, timedelta

import pytest

from app.errores import ErrorDeNegocio
from app.recurrencia import sumar_intervalo, texto_intervalo
from app.repositories import mascota_repositorio as repo
from app.schemas.mascota import MascotaActualizada, MascotaEntrada
from app.services import historial_servicio, mascota_servicio as servicio

HOY = date.today()


def crear_recurrente(session, usuario, cantidad=7, unidad="dias", fecha=None):
    return repo.crear(
        session, "Luna", "Hembra", "Perro", "Baño", fecha or HOY, usuario.id, cantidad, unidad
    )


def pendientes(session, usuario):
    return servicio.filtrar_mascotas(session, usuario.id, estado="pendiente")


@pytest.mark.parametrize(
    "fecha, cantidad, unidad, esperada",
    [
        (date(2026, 11, 4), 7, "dias", date(2026, 11, 11)),
        (date(2026, 12, 28), 7, "dias", date(2027, 1, 4)),
        (date(2026, 11, 4), 3, "meses", date(2027, 2, 4)),
        (date(2026, 11, 4), 1, "anios", date(2027, 11, 4)),
        (date(2026, 12, 15), 1, "meses", date(2027, 1, 15)),
        (date(2027, 1, 31), 1, "meses", date(2027, 2, 28)),
        (date(2028, 1, 31), 1, "meses", date(2028, 2, 29)),
        (date(2028, 2, 29), 1, "anios", date(2029, 2, 28)),
    ],
)
def test_sumar_intervalo(fecha, cantidad, unidad, esperada):
    assert sumar_intervalo(fecha, cantidad, unidad) == esperada


@pytest.mark.parametrize(
    "cantidad, unidad, esperado",
    [(1, "anios", "cada año"), (3, "meses", "cada 3 meses"), (1, "dias", "cada día")],
)
def test_texto_intervalo(cantidad, unidad, esperado):
    assert texto_intervalo(cantidad, unidad) == esperado


def test_realizar_crea_la_siguiente_ocurrencia(session, usuario):
    mascota = crear_recurrente(session, usuario, 3, "meses")

    realizada = servicio.marcar_realizado(session, mascota.id, usuario.id)

    assert realizada.estado == "realizado"
    assert realizada.proxima_fecha is None
    [siguiente] = pendientes(session, usuario)
    assert siguiente.id != mascota.id
    assert siguiente.fecha_cuidado == sumar_intervalo(HOY, 3, "meses")
    assert (siguiente.nombre, siguiente.sexo, siguiente.especie, siguiente.cuidado) == (
        "Luna", "Hembra", "Perro", "Baño",
    )
    assert (siguiente.intervalo_cantidad, siguiente.intervalo_unidad) == (3, "meses")


def test_la_siguiente_conserva_el_responsable(session, usuario, otro_usuario):
    mascota = crear_recurrente(session, usuario)
    servicio.asignar_responsable(session, mascota.id, otro_usuario.correo, usuario.id)

    servicio.marcar_realizado(session, mascota.id, usuario.id)

    [siguiente] = pendientes(session, usuario)
    assert siguiente.responsable_nombre == otro_usuario.nombre_completo


@pytest.mark.parametrize("dias", [-30, 20])
def test_se_calcula_desde_hoy_aunque_se_marque_con_retraso_o_adelanto(session, usuario, dias):
    mascota = crear_recurrente(session, usuario, 7, "dias", HOY + timedelta(days=dias))

    servicio.marcar_realizado(session, mascota.id, usuario.id)

    [siguiente] = pendientes(session, usuario)
    assert siguiente.fecha_cuidado == HOY + timedelta(days=7)


def test_proxima_fecha_anticipa_la_que_se_creara(session, usuario):
    mascota = crear_recurrente(session, usuario, 1, "anios")
    anunciada = mascota.proxima_fecha

    servicio.marcar_realizado(session, mascota.id, usuario.id)

    [siguiente] = pendientes(session, usuario)
    assert siguiente.fecha_cuidado == anunciada


def test_un_cuidado_que_no_se_repite_no_crea_otro(session, usuario, crear_mascota):
    mascota = crear_mascota()
    assert mascota.proxima_fecha is None

    servicio.marcar_realizado(session, mascota.id, usuario.id)

    assert len(servicio.listar_mascotas(session, usuario.id)) == 1
    tipos = [r.tipo_accion for r in historial_servicio.listar_por_usuario(session, usuario.id)]
    assert "programar" not in tipos


def test_el_historial_guarda_cada_vez(session, usuario):
    primera = crear_recurrente(session, usuario)
    servicio.marcar_realizado(session, primera.id, usuario.id)
    [segunda] = pendientes(session, usuario)
    servicio.marcar_realizado(session, segunda.id, usuario.id)
    [tercera] = pendientes(session, usuario)

    historial = list(reversed(historial_servicio.listar_por_usuario(session, usuario.id)))

    assert [(r.tipo_accion, r.mascota_id) for r in historial] == [
        ("realizar", primera.id),
        ("programar", segunda.id),
        ("realizar", segunda.id),
        ("programar", tercera.id),
    ]
    assert segunda.fecha_cuidado.isoformat() in historial[1].descripcion
    assert "cada 7 días" in historial[1].descripcion


def test_crear_recurrente_lo_anota_en_el_historial(session, usuario):
    datos = MascotaEntrada(
        nombre="Luna", sexo="Hembra", especie="Perro", cuidado="Vacuna", fecha_cuidado=HOY,
        intervalo_cantidad=1, intervalo_unidad="anios",
    )

    mascota = servicio.crear_mascota(session, datos, usuario.id)

    assert mascota.proxima_fecha == sumar_intervalo(HOY, 1, "anios")
    assert "cada año" in historial_servicio.listar_por_usuario(session, usuario.id)[0].descripcion


def test_editar_a_no_se_repite_detiene_la_serie(session, usuario):
    mascota = crear_recurrente(session, usuario)
    datos = MascotaActualizada(nombre="Luna", sexo="Hembra", especie="Perro", cuidado="Baño")

    editada = servicio.actualizar_mascota(session, mascota.id, datos, usuario.id)
    assert editada.proxima_fecha is None

    servicio.marcar_realizado(session, mascota.id, usuario.id)
    assert pendientes(session, usuario) == []


def test_eliminar_el_pendiente_detiene_la_serie(session, usuario):
    mascota = crear_recurrente(session, usuario)

    servicio.eliminar_mascota(session, mascota.id, usuario.id)

    assert servicio.listar_mascotas(session, usuario.id) == []


def test_reprogramar_conserva_la_repeticion(session, usuario):
    mascota = crear_recurrente(session, usuario)

    servicio.reprogramar_cuidado(session, mascota.id, usuario.id, HOY + timedelta(days=30))
    servicio.marcar_realizado(session, mascota.id, usuario.id)

    [siguiente] = pendientes(session, usuario)
    assert siguiente.fecha_cuidado == HOY + timedelta(days=7)


@pytest.mark.parametrize(
    "cantidad, unidad",
    [(7, None), (None, "dias"), (0, "dias"), (-1, "meses"), (366, "dias")],
)
def test_intervalo_invalido_se_rechaza(session, usuario, cantidad, unidad):
    datos = MascotaEntrada(
        nombre="Luna", sexo="Hembra", especie="Perro", cuidado="Baño", fecha_cuidado=HOY,
        intervalo_cantidad=cantidad, intervalo_unidad=unidad,
    )

    with pytest.raises(ErrorDeNegocio) as error:
        servicio.crear_mascota(session, datos, usuario.id)

    assert error.value.estado == 400
    assert servicio.listar_mascotas(session, usuario.id) == []


def test_marcar_dos_veces_no_crea_otra_ocurrencia(session, usuario):
    mascota = crear_recurrente(session, usuario)
    servicio.marcar_realizado(session, mascota.id, usuario.id)

    with pytest.raises(ErrorDeNegocio) as error:
        servicio.marcar_realizado(session, mascota.id, usuario.id)

    assert error.value.estado == 400
    assert len(servicio.listar_mascotas(session, usuario.id)) == 2


def test_otro_usuario_no_puede_realizarlo(session, usuario, otro_usuario):
    mascota = crear_recurrente(session, usuario)

    with pytest.raises(ErrorDeNegocio) as error:
        servicio.marcar_realizado(session, mascota.id, otro_usuario.id)

    assert error.value.estado == 404
    assert len(servicio.listar_mascotas(session, usuario.id)) == 1
    assert servicio.listar_mascotas(session, otro_usuario.id) == []
