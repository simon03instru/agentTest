from langchain_core.tools import tool

from db.db_connect import sessionlocal
from services.query_logic import (
    get_realtime_summary,
    get_realtime_off_status,
    get_station_realtime_detail,
)


@tool
def tool_get_summary() -> str:
    """Ambil ringkasan jumlah station berdasarkan tipe_station dan status_realtime."""
    db = sessionlocal()
    try:
        rows = get_realtime_summary(db)

        data = [
            {
                "tipe_station": row.tipe_station,
                "status_realtime": row.status_realtime,
                "total": row.total,
            }
            for row in rows
        ]

        return str(data)
    finally:
        db.close()


@tool
def tool_get_off_stations(tipe_station: str | None = None) -> str:
    """Ambil daftar station yang OFF, DELAY, atau NO DATA. Bisa difilter tipe_station."""
    db = sessionlocal()
    try:
        rows = get_realtime_off_status(db=db, tipe_station=tipe_station)

        data = []
        for row in rows[:30]:
            item = dict(row._mapping) if hasattr(row, "_mapping") else row.__dict__
            item.pop("_sa_instance_state", None)
            data.append(item)

        return str(data)
    finally:
        db.close()


@tool
def tool_get_station_detail(id_station: str) -> str:
    """Ambil detail realtime station berdasarkan id_station."""
    db = sessionlocal()
    try:
        row = get_station_realtime_detail(db, id_station)

        if not row:
            return "Station tidak ditemukan."

        data = dict(row._mapping) if hasattr(row, "_mapping") else row.__dict__
        data.pop("_sa_instance_state", None)

        return str(data)
    finally:
        db.close()

