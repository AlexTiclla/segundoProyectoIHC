from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from app.config import configuracion


def ahora_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def hoy_local() -> date:
    return datetime.now(ZoneInfo(configuracion.zona_horaria)).date()
