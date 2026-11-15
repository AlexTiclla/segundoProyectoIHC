import pytest
from fastapi import Response
from pydantic import ValidationError

from app.config import Configuracion, configuracion
from app.errores import ErrorDeNegocio
from app.routers import auth as auth_router
from app.schemas.usuario import IngresoEntrada, RecuperarEntrada, RegistroEntrada
from app.services import auth_servicio


def test_produccion_rechaza_configuracion_insegura():
    with pytest.raises(ValidationError):
        Configuracion(
            url_base_datos="sqlite:///datos.db",
            secreto_jwt="corto",
            minutos_sesion=60,
            minutos_codigo_recuperacion=15,
            entorno="produccion",
            cookie_segura=False,
            recuperacion_simulada=True,
        )


def test_cookie_de_ingreso_usa_secure_cuando_esta_configurada(session, monkeypatch):
    auth_servicio.registrar(
        session,
        RegistroEntrada(
            nombre_completo="Persona Segura",
            correo="segura@example.com",
            contrasena="contrasena-segura",
        ),
    )
    respuesta = Response()
    monkeypatch.setattr(configuracion, "cookie_segura", True)

    auth_router.ingresar(
        IngresoEntrada(
            correo="segura@example.com", contrasena="contrasena-segura"
        ),
        respuesta,
        session,
    )

    assert "Secure" in respuesta.headers["set-cookie"]
    assert "HttpOnly" in respuesta.headers["set-cookie"]


def test_recuperacion_simulada_desactivada_no_genera_codigo(
    session, usuario, monkeypatch
):
    monkeypatch.setattr(configuracion, "recuperacion_simulada", False)

    with pytest.raises(ErrorDeNegocio) as error:
        auth_router.recuperar(RecuperarEntrada(correo=usuario.correo), session)

    assert error.value.estado == 503
    assert usuario.codigo_recuperacion_hash is None
