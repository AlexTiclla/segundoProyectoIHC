from datetime import date, timedelta

import pytest
from app.errores import ErrorDeNegocio
from app.schemas.mascota import MascotaEntrada
from app.schemas.usuario import IngresoEntrada
from app.seguridad import crear_token
from app.services import acceso_servicio, auth_servicio, cuenta_servicio, mascota_servicio


@pytest.fixture
def compartir(session, usuario, otro_usuario):
    """Ana comparte con Juan y Juan acepta."""
    def _compartir(permiso):
        acceso = acceso_servicio.invitar(session, usuario.id, otro_usuario.correo, permiso)
        return acceso_servicio.responder(session, acceso.id, otro_usuario.id, True)
    return _compartir


def test_eliminar_cuenta_revoca_los_accesos_que_otorgo_y_los_que_recibio(
    session, usuario, otro_usuario, crear_mascota, compartir
):
    crear_mascota()
    otorgado = compartir("gestion")
    recibido = acceso_servicio.invitar(session, otro_usuario.id, usuario.correo, "consulta")
    recibido = acceso_servicio.responder(session, recibido.id, usuario.id, True)

    cuenta_servicio.eliminar_cuenta(session, usuario.id)

    assert otorgado.estado == "revocado"
    assert recibido.estado == "revocado"


def test_eliminar_cuenta_anonimiza_el_nombre_pero_conserva_la_autoria(
    session, usuario, otro_usuario, crear_mascota, compartir
):
    mascota = crear_mascota()
    compartir("gestion")
    mascota_servicio.marcar_realizado(session, mascota.id, otro_usuario.id)

    cuenta_servicio.eliminar_cuenta(session, otro_usuario.id)

    [propia] = mascota_servicio.filtrar_mascotas(session, usuario.id)
    assert propia.realizado_por_nombre == "Usuario eliminado"
    assert usuario.nombre_completo == "Ana Prueba"


def test_no_se_puede_iniciar_sesion_con_una_cuenta_eliminada(session, usuario):
    correo_original = usuario.correo
    cuenta_servicio.eliminar_cuenta(session, usuario.id)

    with pytest.raises(ErrorDeNegocio) as error:
        auth_servicio.autenticar(
            session, IngresoEntrada(correo=correo_original, contrasena="x")
        )
    assert error.value.estado == 401


def test_una_cookie_ya_emitida_deja_de_funcionar_tras_eliminar_la_cuenta(session, usuario):
    token_previo = crear_token(usuario.id)
    cuenta_servicio.eliminar_cuenta(session, usuario.id)

    with pytest.raises(ErrorDeNegocio) as error:
        auth_servicio.usuario_desde_token(session, token_previo)
    assert error.value.estado == 401


def test_no_se_puede_eliminar_dos_veces(session, usuario):
    cuenta_servicio.eliminar_cuenta(session, usuario.id)

    with pytest.raises(ErrorDeNegocio) as error:
        cuenta_servicio.eliminar_cuenta(session, usuario.id)
    assert error.value.estado == 404


def test_exportar_datos_incluye_perfil_mascotas_historial_y_accesos(
    session, usuario, otro_usuario, compartir
):
    # Se crea a través del servicio (no del fixture) para que quede su entrada en el historial.
    mascota_servicio.crear_mascota(
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
    compartir("consulta")

    datos = cuenta_servicio.exportar_datos(session, usuario.id)

    assert datos.perfil.correo == usuario.correo
    assert len(datos.mascotas) == 1
    assert len(datos.historial) == 1
    assert len(datos.accesos_otorgados) == 1
    assert datos.accesos_recibidos == []


def test_exportar_datos_csv_incluye_las_secciones(session, usuario, crear_mascota):
    crear_mascota()

    csv_texto = cuenta_servicio.exportar_datos_csv(session, usuario.id)

    assert "Perfil" in csv_texto
    assert "Mascotas" in csv_texto
    assert "Historial" in csv_texto
    assert "Accesos otorgados" in csv_texto
    assert "Accesos recibidos" in csv_texto
