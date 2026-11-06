from datetime import date, timedelta
import pytest
from app.errores import ErrorDeNegocio
from app.services import mascota_servicio as servicio

HOY=date.today()

@pytest.fixture
def cuidados(crear_mascota):
    return {
        "luna_vacuna": crear_mascota("Luna", "Hembra", "perro", "Vacuna antirrábica", HOY + timedelta(days=2)),
        "rocky_medicamento": crear_mascota("Rocky", "Macho", "perro", "Medicamento", HOY + timedelta(days=20)),
        "mary_control": crear_mascota("Mary", "Hembra", "gato", "Control", HOY + timedelta(days=5)),
        "copito_baño": crear_mascota("Copito", "Macho", "gato", "Baño", HOY + timedelta(days=40)),
    }

def nombres(lista):
    return [m.nombre for m in lista]

def test_sin_filtros_devuelve_todo_ordenado_por_fecha(session,usuario,cuidados):
    resultado = servicio.filtrar_mascotas(session,usuario.id)
    assert nombres(resultado) == ["Luna","Mary","Rocky","Copito"]

def test_buscar_por_nombre_ignora_mayusculas_y_trae_coincidencias_parciales(session, usuario, cuidados):
    assert nombres(servicio.filtrar_mascotas(session, usuario.id, nombre="lun")) == ["Luna"]
    assert nombres(servicio.filtrar_mascotas(session, usuario.id, nombre="  ROCKY ")) == ["Rocky"]
 
 
def test_filtrar_por_estado(session, usuario, cuidados):
    servicio.marcar_realizado(session, cuidados["luna_vacuna"].id, usuario.id)
    pendientes = servicio.filtrar_mascotas(session, usuario.id, estado="pendiente")
    realizados = servicio.filtrar_mascotas(session, usuario.id, estado="realizado")
    assert nombres(realizados) == ["Luna"]
    assert "Luna" not in nombres(pendientes) and len(pendientes) == 3
 
 
def test_filtrar_por_cuidado(session, usuario, cuidados):
    assert nombres(servicio.filtrar_mascotas(session, usuario.id, tipo_cuidado="vacuna")) == ["Luna"]
    assert nombres(servicio.filtrar_mascotas(session, usuario.id, tipo_cuidado="control")) == ["Mary"]
    assert nombres(servicio.filtrar_mascotas(session, usuario.id, tipo_cuidado="  ANTIRR ")) == ["Luna"]
 
 
def test_filtrar_por_rango_de_fechas_incluye_los_extremos(session, usuario, cuidados):
    resultado = servicio.filtrar_mascotas(
        session, usuario.id, fecha_desde=HOY + timedelta(days=2), fecha_hasta=HOY + timedelta(days=5)
    )
    assert nombres(resultado) == ["Luna", "Mary"]
 
 
def test_filtros_combinados(session, usuario, cuidados):
    resultado = servicio.filtrar_mascotas(
        session, usuario.id, estado="pendiente", tipo_cuidado="vacuna",
        fecha_desde=HOY, fecha_hasta=HOY + timedelta(days=7),
    )
    assert nombres(resultado) == ["Luna"]
 
 
def test_sin_coincidencias_devuelve_lista_vacia(session, usuario, cuidados):
    assert servicio.filtrar_mascotas(session, usuario.id, nombre="Firulais") == []
    assert servicio.filtrar_mascotas(session, usuario.id, estado="realizado", tipo_cuidado="vacuna") == []
 
 
def test_no_muestra_cuidados_de_otro_usuario(session, usuario, otro_usuario, cuidados):
    assert servicio.filtrar_mascotas(session, otro_usuario.id) == []
 
 
def test_rango_invertido_se_rechaza(session, usuario, cuidados):
    with pytest.raises(ErrorDeNegocio) as error:
        servicio.filtrar_mascotas(
            session, usuario.id, fecha_desde=HOY + timedelta(days=5), fecha_hasta=HOY
        )
    assert error.value.estado == 400
 
 
def test_cuidado_reprogramado_aparece_por_su_nueva_fecha(session, usuario, cuidados):
    luna = cuidados["luna_vacuna"] 
    servicio.reprogramar_cuidado(session, luna.id, usuario.id, HOY + timedelta(days=60), "Viaje")
 
    en_fecha_vieja = servicio.filtrar_mascotas(
        session, usuario.id, fecha_desde=HOY, fecha_hasta=HOY + timedelta(days=7)
    )
    en_fecha_nueva = servicio.filtrar_mascotas(
        session, usuario.id, fecha_desde=HOY + timedelta(days=55), fecha_hasta=HOY + timedelta(days=65)
    )
    assert "Luna" not in nombres(en_fecha_vieja)
    assert nombres(en_fecha_nueva) == ["Luna"]