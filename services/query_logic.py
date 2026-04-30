from sqlalchemy import func, case, or_
from sqlalchemy.orm import Session
from models.stations import Station
from models.latest_data import StationLatest


def get_realtime_map_status(
    db: Session,
    tipe_station: str | None = None,
    status_realtime: str | None = None,
):
    status_expr = case(
        (StationLatest.id_station.is_(None), "NO DATA"),
        else_=StationLatest.status_realtime,
    )

    query = (
        db.query(
            Station.id_station,
            Station.tipe_station,
            Station.name_station,
            Station.nama_kota,
            Station.latitude,
            Station.longitude,
            Station.elevasi,
            status_expr.label("status_realtime"),
            StationLatest.last_observed_at,
            StationLatest.last_ingested_at,
            StationLatest.interval_detected,
        )
        .outerjoin(StationLatest, Station.id_station == StationLatest.id_station)
    )

    if tipe_station:
        query = query.filter(Station.tipe_station == tipe_station)

    if status_realtime:
        if status_realtime.upper() == "NO DATA":
            query = query.filter(StationLatest.id_station.is_(None))
        else:
            query = query.filter(StationLatest.status_realtime == status_realtime.upper())

    query = query.order_by(Station.tipe_station, Station.name_station)

    return query.all()


def get_all_realtime_status(
    db: Session,
    tipe_station: str | None = None,
    status_realtime: str | None = None,
):
    query = (
        db.query(
            Station.id_station,
            Station.tipe_station,
            Station.name_station,
            Station.nama_kota,
            Station.latitude,
            Station.longitude,
            Station.elevasi,
            StationLatest.last_observed_at,
            StationLatest.last_ingested_at,
            StationLatest.status_realtime,
            StationLatest.interval_detected,
            StationLatest.rr,
            StationLatest.pp_air,
            StationLatest.rh_avg,
            StationLatest.sr_avg,
            StationLatest.sr_max,
            StationLatest.wd_avg,
            StationLatest.ws_avg,
            StationLatest.ws_max,
            StationLatest.tt_air_avg,
            StationLatest.tt_air_min,
            StationLatest.tt_air_max,
            StationLatest.ws_50cm,
            StationLatest.wl_pan,
            StationLatest.ev_pan,
            StationLatest.ws_2m,
        )
        .join(StationLatest, Station.id_station == StationLatest.id_station)
    )

    if tipe_station:
        query = query.filter(Station.tipe_station == tipe_station)

    if status_realtime:
        query = query.filter(StationLatest.status_realtime == status_realtime)

    return query.order_by(Station.tipe_station, Station.name_station).all()


def get_realtime_off_status(db: Session, tipe_station: str | None = None):
    status_expr = case(
        (StationLatest.id_station.is_(None), "NO DATA"),
        else_=StationLatest.status_realtime,
    )

    query = (
        db.query(
            Station.id_station,
            Station.tipe_station,
            Station.name_station,
            Station.nama_kota,
            Station.latitude,
            Station.longitude,
            Station.elevasi,
            StationLatest.last_observed_at,
            StationLatest.last_ingested_at,
            status_expr.label("status_realtime"),
            StationLatest.interval_detected,
            StationLatest.rr,
            StationLatest.pp_air,
            StationLatest.rh_avg,
            StationLatest.sr_avg,
            StationLatest.sr_max,
            StationLatest.wd_avg,
            StationLatest.ws_avg,
            StationLatest.ws_max,
            StationLatest.tt_air_avg,
            StationLatest.tt_air_min,
            StationLatest.tt_air_max,
            StationLatest.ws_50cm,
            StationLatest.wl_pan,
            StationLatest.ev_pan,
            StationLatest.ws_2m,
        )
        .outerjoin(StationLatest, Station.id_station == StationLatest.id_station)
        .filter(
            or_(
                StationLatest.id_station.is_(None),  # belum ada row latest
                StationLatest.status_realtime.in_(["OFF", "NO DATA", "DELAY"]),
            )
        )
    )

    if tipe_station:
        query = query.filter(Station.tipe_station == tipe_station)

    return query.order_by(Station.tipe_station, Station.name_station).all()


# def get_realtime_summary(db: Session):
#     rows = (
#         db.query(
#             Station.tipe_station,
#             StationLatest.status_realtime,
#             func.count(Station.id_station).label("total"),
#         )
#         .join(StationLatest, Station.id_station == StationLatest.id_station)
#         .group_by(Station.tipe_station, StationLatest.status_realtime)
#         .order_by(Station.tipe_station, StationLatest.status_realtime)
#         .all()
#     )
#
#     return rows

def get_realtime_summary(db: Session):
    status_expr = case(
        (StationLatest.id_station.is_(None), "NO DATA"),
        else_=StationLatest.status_realtime,
    )

    rows = (
        db.query(
            Station.tipe_station,
            status_expr.label("status_realtime"),
            func.count(Station.id_station).label("total"),
        )
        .outerjoin(StationLatest, Station.id_station == StationLatest.id_station)
        .group_by(Station.tipe_station, status_expr)
        .order_by(Station.tipe_station, status_expr)
        .all()
    )

    return rows


def get_station_realtime_detail(db: Session, id_station: str):
    row = (
        db.query(
            Station.id_station,
            Station.tipe_station,
            Station.name_station,
            Station.nama_kota,
            Station.latitude,
            Station.longitude,
            Station.elevasi,
            StationLatest.last_observed_at,
            StationLatest.last_ingested_at,
            StationLatest.status_realtime,
            StationLatest.interval_detected,
            StationLatest.rr,
            StationLatest.pp_air,
            StationLatest.rh_avg,
            StationLatest.sr_avg,
            StationLatest.sr_max,
            StationLatest.wd_avg,
            StationLatest.ws_avg,
            StationLatest.ws_max,
            StationLatest.tt_air_avg,
            StationLatest.tt_air_min,
            StationLatest.tt_air_max,
            StationLatest.ws_50cm,
            StationLatest.wl_pan,
            StationLatest.ev_pan,
            StationLatest.ws_2m,
        )
        .join(StationLatest, Station.id_station == StationLatest.id_station)
        .filter(Station.id_station == id_station)
        .first()
    )

    return row

