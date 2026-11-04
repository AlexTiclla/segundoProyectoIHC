import calendar
from datetime import date, timedelta

DIAS = "dias"
MESES = "meses"
ANIOS = "anios"

CANTIDAD_MAXIMA = 365

_NOMBRES = {
    DIAS: ("día", "días"),
    MESES: ("mes", "meses"),
    ANIOS: ("año", "años"),
}


def sumar_intervalo(fecha: date, cantidad: int, unidad: str) -> date:
    if unidad == DIAS:
        return fecha + timedelta(days=cantidad)

    meses = cantidad if unidad == MESES else cantidad * 12
    indice = fecha.year * 12 + (fecha.month - 1) + meses
    anio, mes = indice // 12, indice % 12 + 1
    # Si el mes destino es más corto, queda en su último día: 31 ene + 1 mes = 28 feb
    dia = min(fecha.day, calendar.monthrange(anio, mes)[1])
    return date(anio, mes, dia)


# Las siguientes fechas de la serie (base + k intervalos) posteriores a "despues_de".
def fechas_siguientes(
    base: date,
    despues_de: date,
    cantidad: int,
    unidad: str,
    total: int = 3,
) -> list[date]:
    fechas = []
    veces = 1
    while len(fechas) < total:
        fecha = sumar_intervalo(base, veces * cantidad, unidad)
        if fecha > despues_de:
            fechas.append(fecha)
        veces += 1
    return fechas


def texto_intervalo(cantidad: int, unidad: str) -> str:
    singular, plural = _NOMBRES[unidad]
    return f"cada {singular}" if cantidad == 1 else f"cada {cantidad} {plural}"
