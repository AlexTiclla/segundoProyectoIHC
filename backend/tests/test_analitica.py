from app.routers import analitica
from app.schemas.evento import EventoEntrada, PropiedadesEvento


def registrar(session, usuario, evento, flujo_id):
    datos = EventoEntrada(evento=evento, flujo_id=flujo_id, props=PropiedadesEvento())
    return analitica.registrar_evento(datos, session, usuario)


def test_evento_cuidado_abierto_se_guarda(session, usuario):
    guardado = registrar(session, usuario, "cuidado_abierto", "00000000-0000-4000-8000-000000000001")
    assert guardado.evento == "cuidado_abierto"


def test_evento_cuidado_completado_se_guarda(session, usuario):
    guardado = registrar(session, usuario, "cuidado_completado", "00000000-0000-4000-8000-000000000001")
    assert guardado.evento == "cuidado_completado"


def test_resumen_cuenta_solo_lo_que_se_completo(session, usuario):
    # Dos flujos se abren, solo uno se completa
    registrar(session, usuario, "cuidado_abierto", "00000000-0000-4000-8000-000000000001")
    registrar(session, usuario, "cuidado_abierto", "00000000-0000-4000-8000-000000000002")
    registrar(session, usuario, "cuidado_completado", "00000000-0000-4000-8000-000000000001")

    resumen = analitica.obtener_resumen(session, usuario)

    assert resumen == {"iniciados": 2, "completados": 1, "porcentaje": 50.0}
