from sqlalchemy import func, case, or_, distinct
from sqlalchemy.orm import Session
from models.stations import Station
from models.latest_data import StationLatest
from models.aws_table import ObservationAWS
from models.arg_table import ObservationARG
from models.aaws_table import ObservationAAWS
from datetime import datetime, time, timedelta


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


def get_data_by_date(db, id_station: str, tanggal):


    start_dt = datetime.combine(tanggal, time.min)
    end_dt = start_dt + timedelta(days=1)

    station_info = (
        db.query(Station, StationLatest)
        .outerjoin(StationLatest, Station.id_station == StationLatest.id_station)
        .filter(Station.id_station == str(id_station))
        .first()
    )

    if not station_info:
        return {
            "status": "NOT_FOUND",
            "message": "Station tidak ditemukan di tabel stations",
            "id_station": id_station,
            "tanggal": str(tanggal),
        }

    station, latest = station_info

    tipe_station = station.tipe_station.upper() if station.tipe_station else None

    if tipe_station == "ARG":
        ObsModel = ObservationARG
    elif tipe_station == "AWS":
        ObsModel = ObservationAWS
    elif tipe_station == "AAWS":
        ObsModel = ObservationAAWS
    else:
        return {
            "status": "ERROR",
            "message": "Tipe station tidak dikenali",
            "id_station": station.id_station,
            "tipe_station": station.tipe_station,
        }

    interval_detected = latest.interval_detected if latest and latest.interval_detected else 10

    interval_detected = int(interval_detected.replace('min', ''))

    ideal_data = int((24 * 60) / int(interval_detected))

    total_data = (
        db.query(func.count(distinct(ObsModel.observed_at)))
        .filter(
            ObsModel.id_station == str(id_station),
            ObsModel.observed_at >= start_dt,
            ObsModel.observed_at < end_dt,
        )
        .scalar()
    )

    persen = round((total_data / ideal_data) * 100, 2) if ideal_data else 0

    return {
        "status": "OK",
        "id_station": station.id_station,
        "name_station": station.name_station,
        "tipe_station": station.tipe_station,
        "tanggal": str(tanggal),
        "start_dt": str(start_dt),
        "end_dt": str(end_dt),
        "interval_detected": interval_detected,
        "ideal_data": ideal_data,
        "total_data_masuk": total_data,
        "persentase": persen,
        "status_realtime": latest.status_realtime if latest else "NO DATA",
        "last_observed_at": str(latest.last_observed_at) if latest and latest.last_observed_at else None,
    }



def get_obs_model(tipe_station: str):
    tipe = tipe_station.upper()

    if tipe == "ARG":
        return ObservationARG
    elif tipe == "AWS":
        return ObservationAWS
    elif tipe == "AAWS":
        return ObservationAAWS

    return None


def safe_interval(interval_value):
    try:
        interval_value = int(interval_value)

        if interval_value not in [1, 5, 10, 15, 30, 60]:
            return 10

        return interval_value

    except (ValueError, TypeError):
        return 10


def get_daily_summary_by_type(db, tanggal, tipe_station: str):
    tipe_station = tipe_station.upper()

    start_dt = datetime.combine(tanggal, time.min)
    end_dt = start_dt + timedelta(days=1)

    ObsModel = get_obs_model(tipe_station)

    if ObsModel is None:
        return {
            "status": "ERROR",
            "message": "Tipe station tidak dikenali",
            "tipe_station": tipe_station,
        }

    result = {
        "tanggal": str(tanggal),
        "tipe_station": tipe_station,
        "summary": {
            "total": 0,
            "ON": 0,
            "OFF": 0,
            "DATA_TIDAK_LENGKAP": 0,
        },
        "off_sites": [],
        "tidak_lengkap_sites": [],
    }

    stations = (
        db.query(Station)
        .filter(func.upper(Station.tipe_station) == tipe_station)
        .all()
    )

    for station in stations:
        latest = (
            db.query(StationLatest)
            .filter(StationLatest.id_station == station.id_station)
            .first()
        )

        interval_detected = safe_interval(
            latest.interval_detected if latest else None
        )

        ideal_data = int((24 * 60) / interval_detected)

        total_data_masuk = (
            db.query(func.count(distinct(ObsModel.observed_at)))
            .filter(
                ObsModel.id_station == station.id_station,
                ObsModel.observed_at >= start_dt,
                ObsModel.observed_at < end_dt,
            )
            .scalar()
        )

        persentase = round((total_data_masuk / ideal_data) * 100, 2)

        result["summary"]["total"] += 1

        if total_data_masuk == 0:
            result["summary"]["OFF"] += 1

            result["off_sites"].append({
                "id_station": station.id_station,
                "name_station": station.name_station,
            })

        else:
            result["summary"]["ON"] += 1

            if total_data_masuk < ideal_data:
                result["summary"]["DATA_TIDAK_LENGKAP"] += 1

                result["tidak_lengkap_sites"].append({
                    "id_station": station.id_station,
                    "name_station": station.name_station,
                    "total_data_masuk": total_data_masuk,
                    "ideal_data": ideal_data,
                    "persentase": persentase,
                    "interval_detected": interval_detected,
                })

    return result

