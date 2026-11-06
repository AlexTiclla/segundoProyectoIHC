from datetime import date, timedelta

import pytest
from pydantic import ValidationError

from app.errores import ErrorDeNegocio
from app.schemas.mascota import MascotaEntrada
from app.services import historial_servicio, mascota_servicio as servicio

HOY = date.today()


def datos_mascota(**cambios):
    datos = {
        "nombre": "Luna",
        "sexo": "Hembra",
        "especie": "Perro",
        "cuidado": "Vacuna",
        "fecha_cuidado": HOY,
    }
    return {**datos, **cambios}


def test_crear_con_fecha_pasada_se_rechaza(session, usuario):
    datos = MascotaEntrada(**datos_mascota(fecha_cuidado=HOY - timedelta(days=1)))
    with pytest.raises(ErrorDeNegocio) as error:
        servicio.crear_mascota(session, datos, usuario.id)
    assert error.value.estado == 400
    assert servicio.listar_mascotas(session, usuario.id) == []


def test_crear_con_fecha_de_hoy_se_acepta(session, usuario):
    mascota = servicio.crear_mascota(session, MascotaEntrada(**datos_mascota()), usuario.id)
    assert mascota.fecha_cuidado == HOY


def test_asignar_responsable_queda_en_el_historial(session, usuario, otro_usuario, crear_mascota):
    mascota = crear_mascota()
    resultado = servicio.asignar_responsable(session, mascota.id, otro_usuario.correo, usuario.id)
    assert resultado.responsable_nombre == otro_usuario.nombre_completo

    ultimo = historial_servicio.listar_por_usuario(session, usuario.id)[0]
    assert ultimo.tipo_accion == "responsable"
    assert otro_usuario.nombre_completo in ultimo.descripcion


def test_pendientes_salen_antes_que_realizados(session, usuario, crear_mascota):
    temprano = crear_mascota(nombre="Temprano", fecha=HOY + timedelta(days=1))
    crear_mascota(nombre="Tarde", fecha=HOY + timedelta(days=9))
    crear_mascota(nombre="Atrasado", fecha=HOY - timedelta(days=3))
    servicio.marcar_realizado(session, temprano.id, usuario.id)

    resultado = servicio.filtrar_mascotas(session, usuario.id)
    assert [m.nombre for m in resultado] == ["Atrasado", "Tarde", "Temprano"]


@pytest.mark.parametrize(
    "cambios",
    [{"sexo": "Otro"}, {"cuidado": ""}, {"cuidado": "   "}, {"especie": "  "}],
)
def test_esquema_rechaza_datos_invalidos(cambios):
    with pytest.raises(ValidationError):
        MascotaEntrada(**datos_mascota(**cambios))
