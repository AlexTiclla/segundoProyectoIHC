import pytest
from app.errores import ErrorDeNegocio
from app.services import acceso_servicio, mascota_servicio


@pytest.fixture
def compartir(session, usuario, otro_usuario):
    """Ana comparte con Juan y Juan acepta."""
    def _compartir(permiso):
        acceso = acceso_servicio.invitar(session, usuario.id, otro_usuario.correo, permiso)
        return acceso_servicio.responder(session, acceso.id, otro_usuario.id, True)
    return _compartir


def test_invitacion_pendiente_no_da_acceso(session, usuario, otro_usuario, crear_mascota):
    crear_mascota()
    acceso_servicio.invitar(session, usuario.id, otro_usuario.correo, "gestion")

    assert mascota_servicio.filtrar_mascotas(session, otro_usuario.id) == []


def test_invitado_que_acepta_ve_los_cuidados_con_su_permiso(session, usuario, otro_usuario, crear_mascota, compartir):
    crear_mascota()
    compartir("consulta")

    [mascota] = mascota_servicio.filtrar_mascotas(session, otro_usuario.id)
    assert mascota.permiso == "consulta"
    assert mascota.propietario_nombre == "Ana Prueba"
    assert mascota_servicio.filtrar_mascotas(session, usuario.id)[0].permiso == "propietario"


def test_rechazar_no_da_acceso_y_permite_invitar_de_nuevo(session, usuario, otro_usuario, crear_mascota):
    crear_mascota()
    acceso = acceso_servicio.invitar(session, usuario.id, otro_usuario.correo, "gestion")
    acceso_servicio.responder(session, acceso.id, otro_usuario.id, False)

    assert mascota_servicio.filtrar_mascotas(session, otro_usuario.id) == []
    assert acceso_servicio.invitar(session, usuario.id, otro_usuario.correo, "gestion").estado == "pendiente"


def test_consulta_no_puede_modificar(session, usuario, otro_usuario, crear_mascota, compartir):
    mascota = crear_mascota()
    compartir("consulta")

    with pytest.raises(ErrorDeNegocio) as error:
        mascota_servicio.marcar_realizado(session, mascota.id, otro_usuario.id)
    assert error.value.estado == 403


def test_gestion_realiza_y_queda_el_autor(session, usuario, otro_usuario, crear_mascota, compartir):
    mascota = crear_mascota()
    compartir("gestion")

    hecho = mascota_servicio.marcar_realizado(session, mascota.id, otro_usuario.id)

    assert hecho.estado == "realizado"
    assert hecho.realizado_por_nombre == "Juan Prueba"
    assert hecho.realizado_en is not None


def test_gestion_no_elimina_ni_asigna_responsable(session, usuario, otro_usuario, crear_mascota, compartir):
    mascota = crear_mascota()
    compartir("gestion")

    with pytest.raises(ErrorDeNegocio) as error:
        mascota_servicio.eliminar_mascota(session, mascota.id, otro_usuario.id)
    assert error.value.estado == 404
    with pytest.raises(ErrorDeNegocio) as error:
        mascota_servicio.asignar_responsable(session, mascota.id, usuario.correo, otro_usuario.id)
    assert error.value.estado == 404


def test_revocar_quita_el_acceso_pero_conserva_al_autor(session, usuario, otro_usuario, crear_mascota, compartir):
    mascota = crear_mascota()
    acceso = compartir("gestion")
    mascota_servicio.marcar_realizado(session, mascota.id, otro_usuario.id)

    acceso_servicio.revocar(session, acceso.id, usuario.id)

    assert mascota_servicio.filtrar_mascotas(session, otro_usuario.id) == []
    with pytest.raises(ErrorDeNegocio) as error:
        mascota_servicio.obtener(session, mascota.id, otro_usuario.id)
    assert error.value.estado == 404
    [propia] = mascota_servicio.filtrar_mascotas(session, usuario.id)
    assert propia.realizado_por_nombre == "Juan Prueba"


def test_solo_el_propietario_revoca_y_solo_el_invitado_responde(session, usuario, otro_usuario, compartir):
    acceso = acceso_servicio.invitar(session, usuario.id, otro_usuario.correo, "consulta")

    with pytest.raises(ErrorDeNegocio) as error:
        acceso_servicio.responder(session, acceso.id, usuario.id, True)
    assert error.value.estado == 404
    acceso_servicio.responder(session, acceso.id, otro_usuario.id, True)
    with pytest.raises(ErrorDeNegocio) as error:
        acceso_servicio.revocar(session, acceso.id, otro_usuario.id)
    assert error.value.estado == 404


def test_no_se_invita_dos_veces_ni_a_uno_mismo(session, usuario, otro_usuario):
    acceso_servicio.invitar(session, usuario.id, otro_usuario.correo, "consulta")

    with pytest.raises(ErrorDeNegocio) as error:
        acceso_servicio.invitar(session, usuario.id, otro_usuario.correo, "gestion")
    assert error.value.estado == 409
    with pytest.raises(ErrorDeNegocio) as error:
        acceso_servicio.invitar(session, usuario.id, usuario.correo, "gestion")
    assert error.value.estado == 400
