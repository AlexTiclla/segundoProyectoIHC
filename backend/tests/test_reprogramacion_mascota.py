from datetime import date,timedelta
import pytest
from app.models.reprogramacion import FUTURAS, SOLO_ESTA
from app.errores import ErrorDeNegocio
from app.repositories import mascota_repositorio as repo
from app.services import historial_servicio, mascota_servicio as servicio
from app.models.usuario import Usuario

MENSAJE_REALIZADO = "Este cuidado ya fue realizado, por eso no se puede reprogramar"    
MENSAJE_FECHA_FALSA = "La nueva fecha no puede ser anterior a hoy"
MOTIVO = "El veterinario no atiende ese día"
HOY = date.today()

def test_reprogramar_cuidado_exitoso(session, usuario,crear_mascota):
    mascota = crear_mascota()
    nueva_fecha = date.today()+ timedelta(days=5)
    resultado = servicio.reprogramar_cuidado(session,mascota.id,usuario.id,nueva_fecha,MOTIVO)
    assert resultado.fecha_cuidado == nueva_fecha

def test_reprogramar_cuidado_realizado_no_cambia_la_fecha(session, usuario, crear_mascota):
    mascota = crear_mascota()
    fecha_original = mascota.fecha_cuidado
    servicio.marcar_realizado(session, mascota.id, usuario.id)
    with pytest.raises(ErrorDeNegocio):
        servicio.reprogramar_cuidado(
            session, mascota.id, usuario.id, date.today() + timedelta(days=4), MOTIVO
        )
    session.expire_all()
    assert repo.buscar_por_id(session, mascota.id).fecha_cuidado == fecha_original

def test_fecha_pasada_no_cambia_la_fecha_guardada(session, usuario, crear_mascota):
    mascota = crear_mascota()
    fecha_original = mascota.fecha_cuidado
    with pytest.raises(ErrorDeNegocio):
        servicio.reprogramar_cuidado(
            session, mascota.id, usuario.id, date.today() - timedelta(days=1), MOTIVO
        )
    session.expire_all()
    assert repo.buscar_por_id(session, mascota.id).fecha_cuidado == fecha_original    

def test_otro_usuario_no_cambia_la_fecha_original(session, usuario, otro_usuario, crear_mascota):
    mascota = crear_mascota()
    fecha_original = mascota.fecha_cuidado
    with pytest.raises(ErrorDeNegocio):
        servicio.reprogramar_cuidado(
            session, mascota.id, otro_usuario.id, date.today() + timedelta(days=10), MOTIVO
        )
    session.expire_all()
    assert repo.buscar_por_id(session, mascota.id).fecha_cuidado == fecha_original

def test_nueva_fecha_se_mantiene_al_recargar(session, usuario, crear_mascota):
    mascota = crear_mascota()
    mascota_id = mascota.id
    nueva_fecha = date.today() + timedelta(days=9)
    servicio.reprogramar_cuidado(session, mascota_id, usuario.id, nueva_fecha, MOTIVO)
 
    session.expire_all()
    recargada = repo.buscar_por_id(session, mascota_id)
    assert recargada.fecha_cuidado == nueva_fecha


def dias(cantidad):
    return HOY + timedelta(days=cantidad)


def crear_semanal(session, usuario, fecha=None):
    return repo.crear(session, "Rocky", "Macho", "Perro", "Baño", fecha or HOY, usuario.id, 7, "dias")


def test_el_motivo_es_obligatorio(session, usuario, crear_mascota):
    mascota = crear_mascota()
    fecha_original = mascota.fecha_cuidado
    with pytest.raises(ErrorDeNegocio) as error:
        servicio.reprogramar_cuidado(session, mascota.id, usuario.id, dias(9), "   ")
    assert error.value.estado == 400
    session.expire_all()
    recargada = repo.buscar_por_id(session, mascota.id)
    assert recargada.fecha_cuidado == fecha_original
    assert recargada.reprogramaciones == []


def test_la_misma_fecha_se_rechaza(session, usuario, crear_mascota):
    mascota = crear_mascota()
    with pytest.raises(ErrorDeNegocio) as error:
        servicio.reprogramar_cuidado(session, mascota.id, usuario.id, mascota.fecha_cuidado, MOTIVO)
    assert error.value.estado == 400


def test_futuras_en_un_cuidado_que_no_se_repite_se_rechaza(session, usuario, crear_mascota):
    mascota = crear_mascota()
    with pytest.raises(ErrorDeNegocio) as error:
        servicio.reprogramar_cuidado(session, mascota.id, usuario.id, dias(9), MOTIVO, FUTURAS)
    assert error.value.estado == 400


def test_solo_esta_conserva_las_siguientes(session, usuario):
    mascota = crear_semanal(session, usuario)
    antes = mascota.proximas_fechas
    assert antes == [dias(7), dias(14), dias(21)]

    movida = servicio.reprogramar_cuidado(session, mascota.id, usuario.id, dias(2), MOTIVO, SOLO_ESTA)

    assert movida.fecha_cuidado == dias(2)
    assert movida.proximas_fechas == antes


def test_futuras_desplaza_la_misma_diferencia(session, usuario):
    mascota = crear_semanal(session, usuario)

    movida = servicio.reprogramar_cuidado(session, mascota.id, usuario.id, dias(2), MOTIVO, FUTURAS)

    assert movida.fecha_cuidado == dias(2)
    assert movida.proximas_fechas == [dias(9), dias(16), dias(23)]


def test_futuras_tambien_adelanta(session, usuario):
    mascota = crear_semanal(session, usuario, dias(10))

    movida = servicio.reprogramar_cuidado(session, mascota.id, usuario.id, dias(7), MOTIVO, FUTURAS)

    assert movida.proximas_fechas == [dias(14), dias(21), dias(28)]


def test_solo_esta_despues_de_las_siguientes_no_las_desordena(session, usuario):
    mascota = crear_semanal(session, usuario)

    movida = servicio.reprogramar_cuidado(session, mascota.id, usuario.id, dias(10), MOTIVO, SOLO_ESTA)

    assert movida.proximas_fechas == [dias(14), dias(21), dias(28)]


def test_marcar_realizado_respeta_lo_elegido(session, usuario):
    solo_esta = crear_semanal(session, usuario)
    servicio.reprogramar_cuidado(session, solo_esta.id, usuario.id, dias(2), MOTIVO, SOLO_ESTA)
    servicio.marcar_realizado(session, solo_esta.id, usuario.id)
    [siguiente] = servicio.filtrar_mascotas(session, usuario.id, estado="pendiente")
    assert siguiente.fecha_cuidado == dias(7)
    servicio.eliminar_mascota(session, siguiente.id, usuario.id)

    futuras = crear_semanal(session, usuario)
    servicio.reprogramar_cuidado(session, futuras.id, usuario.id, dias(2), MOTIVO, FUTURAS)
    servicio.marcar_realizado(session, futuras.id, usuario.id)
    [siguiente] = servicio.filtrar_mascotas(session, usuario.id, estado="pendiente")
    assert siguiente.fecha_cuidado == dias(9)


def test_futuras_no_toca_realizados_ni_crea_filas(session, usuario):
    primera = crear_semanal(session, usuario)
    servicio.marcar_realizado(session, primera.id, usuario.id)
    [segunda] = servicio.filtrar_mascotas(session, usuario.id, estado="pendiente")

    servicio.reprogramar_cuidado(session, segunda.id, usuario.id, dias(12), MOTIVO, FUTURAS)

    session.expire_all()
    todas = servicio.listar_mascotas(session, usuario.id)
    assert len(todas) == 2
    realizada = repo.buscar_por_id(session, primera.id)
    assert realizada.estado == "realizado"
    assert realizada.fecha_cuidado == HOY
    assert realizada.reprogramaciones == []
    assert repo.buscar_por_id(session, segunda.id).proximas_fechas[0] == dias(19)


def test_conserva_fecha_original_y_cambios_anteriores(session, usuario):
    mascota = crear_semanal(session, usuario, dias(1))
    servicio.reprogramar_cuidado(session, mascota.id, usuario.id, dias(3), "Primer motivo")
    servicio.reprogramar_cuidado(session, mascota.id, usuario.id, dias(5), "  Segundo motivo ", FUTURAS)

    session.expire_all()
    recargada = repo.buscar_por_id(session, mascota.id)
    assert recargada.fecha_original == dias(1)
    assert [
        (r.fecha_anterior, r.fecha_nueva, r.diferencia_dias, r.motivo, r.alcance)
        for r in recargada.reprogramaciones
    ] == [
        (dias(1), dias(3), 2, "Primer motivo", SOLO_ESTA),
        (dias(3), dias(5), 2, "Segundo motivo", FUTURAS),
    ]


def test_el_historial_guarda_fechas_motivo_y_alcance(session, usuario):
    mascota = crear_semanal(session, usuario)
    servicio.reprogramar_cuidado(session, mascota.id, usuario.id, dias(2), MOTIVO, FUTURAS)

    registro = historial_servicio.listar_por_usuario(session, usuario.id)[0]

    assert registro.tipo_accion == "reprogramar"
    assert HOY.isoformat() in registro.descripcion
    assert dias(2).isoformat() in registro.descripcion
    assert MOTIVO in registro.descripcion
    assert "esta y las siguientes" in registro.descripcion
