import csv
import io
import secrets

from sqlalchemy.orm import Session

from app.errores import ErrorDeNegocio
from app.repositories import acceso_repositorio as repo_acceso
from app.repositories import mascota_repositorio as repo_mascota
from app.repositories import usuario_repositorio as repo_usuario
from app.schemas.cuenta import MisDatosSalida
from app.seguridad import hashear_contrasena
from app.services import acceso_servicio, historial_servicio


def exportar_datos(session: Session, usuario_id: int) -> MisDatosSalida:
    usuario = repo_usuario.buscar_por_id(session, usuario_id)
    if usuario is None:
        raise ErrorDeNegocio("No se encontró el usuario", 404)
    return MisDatosSalida(
        perfil=usuario,
        mascotas=repo_mascota.buscar_todas_por_propietario(session, usuario_id),
        historial=historial_servicio.listar_por_usuario(session, usuario_id),
        accesos_otorgados=acceso_servicio.enviados(session, usuario_id),
        accesos_recibidos=acceso_servicio.recibidos(session, usuario_id),
    )


def exportar_datos_csv(session: Session, usuario_id: int) -> str:
    datos = exportar_datos(session, usuario_id)
    salida = io.StringIO()
    escritor = csv.writer(salida)

    escritor.writerow(["Perfil"])
    escritor.writerow(["id", "nombre_completo", "correo", "creado_en"])
    escritor.writerow(
        [datos.perfil.id, datos.perfil.nombre_completo, datos.perfil.correo, datos.perfil.creado_en]
    )
    escritor.writerow([])

    escritor.writerow(["Mascotas"])
    escritor.writerow(
        ["id", "nombre", "especie", "cuidado", "fecha_cuidado", "estado", "realizado_por_nombre", "realizado_en"]
    )
    for mascota in datos.mascotas:
        escritor.writerow(
            [
                mascota.id,
                mascota.nombre,
                mascota.especie,
                mascota.cuidado,
                mascota.fecha_cuidado,
                mascota.estado,
                mascota.realizado_por_nombre,
                mascota.realizado_en,
            ]
        )
    escritor.writerow([])

    escritor.writerow(["Historial"])
    escritor.writerow(["fecha_registro", "tipo_accion", "descripcion"])
    for entrada in datos.historial:
        escritor.writerow([entrada.fecha_registro, entrada.tipo_accion, entrada.descripcion])
    escritor.writerow([])

    escritor.writerow(["Accesos otorgados"])
    escritor.writerow(["invitado_nombre", "invitado_correo", "permiso", "estado"])
    for acceso in datos.accesos_otorgados:
        escritor.writerow([acceso.invitado_nombre, acceso.invitado_correo, acceso.permiso, acceso.estado])
    escritor.writerow([])

    escritor.writerow(["Accesos recibidos"])
    escritor.writerow(["propietario_nombre", "permiso", "estado"])
    for acceso in datos.accesos_recibidos:
        escritor.writerow([acceso.propietario_nombre, acceso.permiso, acceso.estado])

    return salida.getvalue()


# Regla de Mascota al Día: no se borra la cuenta, se anonimiza. Revoca los accesos
# compartidos en ambos sentidos y deja la fila sin poder volver a autenticarse, pero
# los cuidados ya realizados conservan el autor como "Usuario eliminado" porque las
# propiedades de Mascota y Acceso leen el nombre en vivo desde esta misma fila.
def eliminar_cuenta(session: Session, usuario_id: int) -> None:
    usuario = repo_usuario.buscar_por_id(session, usuario_id)
    if usuario is None or usuario.eliminado:
        raise ErrorDeNegocio("No se encontró la cuenta", 404)
    repo_acceso.revocar_todos_de_usuario(session, usuario_id)
    contrasena_irrecuperable = hashear_contrasena(secrets.token_hex(32))
    repo_usuario.anonimizar(session, usuario, contrasena_irrecuperable)
