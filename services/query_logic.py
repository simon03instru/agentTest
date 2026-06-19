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
        (StationLatest.id_station.is_(None), "OFF"),
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
        if status_realtime.upper() == "OFF":
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
        (StationLatest.id_station.is_(None), "OFF"),
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
                StationLatest.status_realtime.in_(["OFF", "DELAY"]),
            )
        )
    )

    if tipe_station:
        query = query.filter(Station.tipe_station == tipe_station)

    return query.order_by(Station.tipe_station, Station.name_station).all()


def get_realtime_summary(db: Session):
    status_expr = case(
        (StationLatest.id_station.is_(None), "OFF"),
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
    data_real = (db.query(Station.id_station, Station.tipe_station).filter(Station.id_station == id_station)).first()
    type = data_real.tipe_station
    if type == "arg":
        data_row_arg = (
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
            )
            .join(StationLatest, Station.id_station == StationLatest.id_station)
            .filter(Station.id_station == id_station)
            .first()
        )
        return data_row_arg

    elif type == "aws":
        data_row_aws = (
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
            )
            .join(StationLatest, Station.id_station == StationLatest.id_station)
            .filter(Station.id_station == id_station)
            .first()
        )
        return data_row_aws

    elif type == "aaws":
        data_row_aaws = (
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
                StationLatest.ws_2m,
            )
            .join(StationLatest, Station.id_station == StationLatest.id_station)
            .filter(Station.id_station == id_station)
            .first()
        )
        return data_row_aaws

    else:
        return {"None"}


def get_export_data_oneday(db: Session, id_station: str, tanggal):
    start_dt = datetime.combine(tanggal, time.min)
    end_dt = start_dt + timedelta(days=1)
    data = (db.query(Station.id_station, Station.tipe_station).filter(Station.id_station == id_station)).first()
    type = data.tipe_station
    if type == "arg":
        ObsModel = ObservationARG
        data_row_arg = (
            db.query(
                Station.id_station,
                Station.tipe_station,
                Station.name_station,
                Station.nama_kota,
                Station.latitude,
                Station.longitude,
                Station.elevasi,
                ObsModel.observed_at,
                ObsModel.ingested_at,
                ObsModel.rr,
            )
            .join(ObsModel, Station.id_station == ObsModel.id_station)
            .filter(Station.id_station == id_station,
                    ObsModel.observed_at >= start_dt,
                    ObsModel.observed_at < end_dt,).all()
        )
        items = [dict(row._mapping) for row in data_row_arg]
        return {
            "id_station": id_station,
            "tipe_station": "arg",
            "series": {
                "rr": [
                    {
                        "time": item["observed_at"].isoformat(),
                        "rr": item["rr"],
                    }
                    for item in items
                ]
            }
        }

    elif type == "aws":
        ObsModel = ObservationAWS
        data_row_aws = (
            db.query(
                Station.id_station,
                Station.tipe_station,
                Station.name_station,
                Station.nama_kota,
                Station.latitude,
                Station.longitude,
                Station.elevasi,
                ObsModel.observed_at,
                ObsModel.ingested_at,
                ObsModel.rr,
                ObsModel.pp_air,
                ObsModel.rh_avg,
                ObsModel.sr_avg,
                ObsModel.sr_max,
                ObsModel.wd_avg,
                ObsModel.ws_avg,
                ObsModel.ws_max,
                ObsModel.tt_air_avg,
                ObsModel.tt_air_min,
                ObsModel.tt_air_max,
            )
            .join(ObsModel, Station.id_station == ObsModel.id_station)
            .filter(Station.id_station == id_station,
                    ObsModel.observed_at >= start_dt,
                    ObsModel.observed_at < end_dt,).all()
        )
        items = [dict(row._mapping) for row in data_row_aws]
        return {
            "id_station": id_station,
            "tipe_station": "aws",
            "series": {
                "rr": [
                    {
                        "time": item["observed_at"].isoformat(),
                        "rr": item["rr"],
                        "pp_air": item["pp_air"],
                        "rh_avg": item["rh_avg"],
                        "sr_avg": item["sr_avg"],
                        "sr_max": item["sr_max"],
                        "wd_avg": item["wd_avg"],
                        "ws_avg": item["ws_avg"],
                        "ws_max": item["ws_max"],
                        "tt_air_avg": item["tt_air_avg"],
                        "tt_air_min": item["tt_air_min"],
                        "tt_air_max": item["tt_air_max"],
                    }
                    for item in items
                ]
            }
        }

    elif type == "aaws":
        ObsModel = ObservationAAWS
        data_row_aaws = (
            db.query(
                Station.id_station,
                Station.tipe_station,
                Station.name_station,
                Station.nama_kota,
                Station.latitude,
                Station.longitude,
                Station.elevasi,
                ObsModel.observed_at,
                ObsModel.ingested_at,
                ObsModel.rr,
                ObsModel.pp_air,
                ObsModel.rh_avg,
                ObsModel.sr_avg,
                ObsModel.sr_max,
                ObsModel.wd_avg,
                ObsModel.ws_avg,
                ObsModel.ws_max,
                ObsModel.tt_air_avg,
                ObsModel.tt_air_min,
                ObsModel.tt_air_max,
                ObsModel.ws_50cm,
                ObsModel.ws_2m,
            )
            .join(ObsModel, Station.id_station == ObsModel.id_station)
            .filter(Station.id_station == id_station,
                    ObsModel.observed_at >= start_dt,
                    ObsModel.observed_at < end_dt,).all()
        )
        items = [dict(row._mapping) for row in data_row_aaws]
        return {
            "id_station": id_station,
            "tipe_station": "aaws",
            "series": {
                "rr": [
                    {
                        "time": item["observed_at"].isoformat(),
                        "rr": item["rr"],
                        "pp_air": item["pp_air"],
                        "rh_avg": item["rh_avg"],
                        "sr_avg": item["sr_avg"],
                        "sr_max": item["sr_max"],
                        "wd_avg": item["wd_avg"],
                        "ws_avg": item["ws_avg"],
                        "ws_max": item["ws_max"],
                        "tt_air_avg": item["tt_air_avg"],
                        "tt_air_min": item["tt_air_min"],
                        "tt_air_max": item["tt_air_max"],
                        "ws_50cm":item["ws_50cm"],
                        "ws_2m":item["ws_2m"]
                    }
                    for item in items
                ]
            }
        }

    else:
        return {"None"}



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
        "status_realtime": latest.status_realtime if latest else "OFF",
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


def get_reporting_overview(db: Session, hours: int = 24):
    now = datetime.utcnow()
    since = now - timedelta(hours=hours)

    status_expr = case(
        (StationLatest.id_station.is_(None), "OFF"),
        else_=StationLatest.status_realtime,
    )

    total_stations = db.query(func.count(Station.id_station)).scalar() or 0
    active_stations = (
        db.query(func.count(Station.id_station))
        .filter(Station.is_active.is_(True))
        .scalar()
        or 0
    )
    stations_with_latest = db.query(func.count(StationLatest.id_station)).scalar() or 0

    status_breakdown = (
        db.query(
            Station.tipe_station.label("tipe_station"),
            status_expr.label("status_realtime"),
            func.count(Station.id_station).label("total"),
        )
        .outerjoin(StationLatest, Station.id_station == StationLatest.id_station)
        .group_by(Station.tipe_station, status_expr)
        .order_by(Station.tipe_station, status_expr)
        .all()
    )

    stale_or_problematic_stations = (
        db.query(
            Station.id_station,
            Station.tipe_station,
            Station.name_station,
            Station.nama_kota,
            StationLatest.status_realtime,
            StationLatest.last_observed_at,
            StationLatest.last_ingested_at,
            StationLatest.interval_detected,
        )
        .join(StationLatest, Station.id_station == StationLatest.id_station)
        .filter(
            or_(
                StationLatest.last_observed_at.is_(None),
                StationLatest.last_observed_at < since,
                StationLatest.status_realtime.in_(["OFF", "DELAY"]),
            )
        )
        .order_by(StationLatest.last_ingested_at.desc())
        .limit(25)
        .all()
    )

    return {
        "generated_at": now.isoformat() + "Z",
        "window_hours": hours,
        "summary": {
            "total_stations": total_stations,
            "active_stations": active_stations,
            "stations_with_latest": stations_with_latest,
        },
        "status_breakdown": [
            {
                "tipe_station": row.tipe_station,
                "status_realtime": row.status_realtime,
                "total": row.total,
            }
            for row in status_breakdown
        ],
        "stale_or_problematic_stations": [
            {
                "id_station": row.id_station,
                "tipe_station": row.tipe_station,
                "name_station": row.name_station,
                "nama_kota": row.nama_kota,
                "status_realtime": row.status_realtime,
                "last_observed_at": row.last_observed_at.isoformat() if row.last_observed_at else None,
                "last_ingested_at": row.last_ingested_at.isoformat() if row.last_ingested_at else None,
                "interval_detected": row.interval_detected,
            }
            for row in stale_or_problematic_stations
        ],
    }


def get_reporting_station_detail(db: Session, id_station: str):
    station = (
        db.query(
            Station.id_station,
            Station.tipe_station,
            Station.name_station,
            Station.nama_kota,
            Station.latitude,
            Station.longitude,
            Station.elevasi,
            Station.is_active,
            Station.created_at,
            Station.updated_at,
        )
        .filter(Station.id_station == id_station)
        .first()
    )

    if not station:
        return None

    latest = (
        db.query(StationLatest)
        .filter(StationLatest.id_station == id_station)
        .first()
    )

    history_model = {
        "arg": ObservationARG,
        "aws": ObservationAWS,
        "aaws": ObservationAAWS,
    }.get(station.tipe_station)

    recent_history = []
    if history_model is not None:
        recent_history = (
            db.query(history_model)
            .filter(history_model.id_station == id_station)
            .order_by(history_model.observed_at.desc())
            .limit(10)
            .all()
        )

    def serialize_station(row):
        return {
            "id_station": row.id_station,
            "tipe_station": row.tipe_station,
            "name_station": row.name_station,
            "nama_kota": row.nama_kota,
            "latitude": row.latitude,
            "longitude": row.longitude,
            "elevasi": row.elevasi,
            "is_active": row.is_active,
            "created_at": row.created_at.isoformat() if row.created_at else None,
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        }

    def serialize_latest(row):
        return None if row is None else {
            "status_realtime": row.status_realtime,
            "last_observed_at": row.last_observed_at.isoformat() if row.last_observed_at else None,
            "last_ingested_at": row.last_ingested_at.isoformat() if row.last_ingested_at else None,
            "interval_detected": row.interval_detected,
            "rr": row.rr,
            "pp_air": row.pp_air,
            "rh_avg": row.rh_avg,
            "sr_avg": row.sr_avg,
            "sr_max": row.sr_max,
            "wd_avg": row.wd_avg,
            "ws_avg": row.ws_avg,
            "ws_max": row.ws_max,
            "tt_air_avg": row.tt_air_avg,
            "tt_air_min": row.tt_air_min,
            "tt_air_max": row.tt_air_max,
            "ws_50cm": row.ws_50cm,
            "wl_pan": row.wl_pan,
            "ev_pan": row.ev_pan,
            "ws_2m": row.ws_2m,
        }

    def serialize_history(row):
        data = row.__dict__.copy()
        data.pop("_sa_instance_state", None)
        data.pop("id", None)
        data.pop("id_station", None)
        data.pop("observed_at", None)
        data.pop("ingested_at", None)
        return {
            "observed_at": row.observed_at.isoformat() if row.observed_at else None,
            "ingested_at": row.ingested_at.isoformat() if row.ingested_at else None,
            "data": data,
        }

    return {
        "station": serialize_station(station),
        "latest": serialize_latest(latest),
        "history": [serialize_history(row) for row in recent_history],
    }


def get_reporting_status_breakdown(db: Session):
    status_expr = case(
        (StationLatest.id_station.is_(None), "OFF"),
        else_=StationLatest.status_realtime,
    )

    rows = (
        db.query(
            Station.tipe_station.label("tipe_station"),
            status_expr.label("status_realtime"),
            func.count(Station.id_station).label("total"),
        )
        .outerjoin(StationLatest, Station.id_station == StationLatest.id_station)
        .group_by(Station.tipe_station, status_expr)
        .order_by(Station.tipe_station, status_expr)
        .all()
    )

    return {
        "items": [
            {
                "tipe_station": row.tipe_station,
                "status_realtime": row.status_realtime,
                "total": row.total,
            }
            for row in rows
        ]
    }


def get_reporting_freshness(db: Session, hours: int = 24):
    now = datetime.utcnow()
    threshold = now - timedelta(hours=hours)

    rows = (
        db.query(
            Station.id_station,
            Station.tipe_station,
            Station.name_station,
            Station.nama_kota,
            Station.is_active,
            StationLatest.status_realtime,
            StationLatest.last_observed_at,
            StationLatest.last_ingested_at,
            StationLatest.interval_detected,
        )
        .outerjoin(StationLatest, Station.id_station == StationLatest.id_station)
        .order_by(StationLatest.last_observed_at.asc().nullsfirst(), Station.name_station.asc())
        .all()
    )

    items = []
    for row in rows:
        last_observed = row.last_observed_at
        age_hours = None
        stale = True
        if last_observed is not None:
            delta = now - last_observed.replace(tzinfo=None) if last_observed.tzinfo else now - last_observed
            age_hours = round(delta.total_seconds() / 3600, 2)
            stale = last_observed < threshold

        items.append(
            {
                "id_station": row.id_station,
                "tipe_station": row.tipe_station,
                "name_station": row.name_station,
                "nama_kota": row.nama_kota,
                "is_active": row.is_active,
                "status_realtime": row.status_realtime if row.status_realtime else "OFF",
                "last_observed_at": row.last_observed_at.isoformat() if row.last_observed_at else None,
                "last_ingested_at": row.last_ingested_at.isoformat() if row.last_ingested_at else None,
                "interval_detected": row.interval_detected,
                "age_hours": age_hours,
                "is_stale": stale,
            }
        )

    return {
        "generated_at": now.isoformat() + "Z",
        "window_hours": hours,
        "items": items,
    }


def get_reporting_health_ranking(db: Session, hours: int = 24, limit: int = 20):
    now = datetime.utcnow()
    threshold = now - timedelta(hours=hours)

    rows = (
        db.query(
            Station.id_station,
            Station.tipe_station,
            Station.name_station,
            Station.nama_kota,
            Station.is_active,
            StationLatest.status_realtime,
            StationLatest.last_observed_at,
            StationLatest.last_ingested_at,
            StationLatest.interval_detected,
        )
        .join(StationLatest, Station.id_station == StationLatest.id_station)
        .all()
    )

    ranked = []
    for row in rows:
        score = 100.0
        status = row.status_realtime or "OFF"
        if status == "ON":
            score += 0
        elif status == "DELAY":
            score -= 20
        elif status == "OFF":
            score -= 45
        else:
            score -= 30

        last_observed = row.last_observed_at
        age_hours = None
        if last_observed is not None:
            delta = now - last_observed.replace(tzinfo=None) if last_observed.tzinfo else now - last_observed
            age_hours = delta.total_seconds() / 3600
            if age_hours > hours:
                score -= min(30, (age_hours - hours) * 2)
            else:
                score -= min(15, age_hours * 1.5)
        else:
            score -= 35

        if not row.is_active:
            score -= 10

        interval = safe_interval(row.interval_detected)
        if interval >= 30:
            score -= 2

        score = max(0.0, round(score, 2))
        ranked.append(
            {
                "id_station": row.id_station,
                "tipe_station": row.tipe_station,
                "name_station": row.name_station,
                "nama_kota": row.nama_kota,
                "status_realtime": status,
                "last_observed_at": row.last_observed_at.isoformat() if row.last_observed_at else None,
                "last_ingested_at": row.last_ingested_at.isoformat() if row.last_ingested_at else None,
                "age_hours": round(age_hours, 2) if age_hours is not None else None,
                "interval_detected": row.interval_detected,
                "health_score": score,
            }
        )

    ranked.sort(key=lambda item: item["health_score"], reverse=True)

    return {
        "generated_at": now.isoformat() + "Z",
        "window_hours": hours,
        "items": ranked[:limit],
    }


def get_reporting_daily_trend(db: Session, tipe_station: str, days: int = 7):
    tipe_station = tipe_station.upper()
    end_dt = datetime.utcnow()
    start_dt = end_dt - timedelta(days=days)

    if tipe_station == "ARG":
        obs_model = ObservationARG
    elif tipe_station == "AWS":
        obs_model = ObservationAWS
    elif tipe_station == "AAWS":
        obs_model = ObservationAAWS
    else:
        return {
            "status": "ERROR",
            "message": "Tipe station tidak dikenali",
            "tipe_station": tipe_station,
        }

    rows = (
        db.query(
            func.date(obs_model.observed_at).label("day"),
            func.count(distinct(obs_model.id_station)).label("active_stations"),
            func.count(obs_model.id).label("observations"),
            func.count(distinct(obs_model.observed_at)).label("unique_timestamps"),
        )
        .filter(
            obs_model.observed_at >= start_dt,
            obs_model.observed_at < end_dt,
        )
        .group_by(func.date(obs_model.observed_at))
        .order_by(func.date(obs_model.observed_at))
        .all()
    )

    daily = [
        {
            "day": row.day.isoformat() if hasattr(row.day, "isoformat") else str(row.day),
            "active_stations": row.active_stations,
            "observations": row.observations,
            "unique_timestamps": row.unique_timestamps,
        }
        for row in rows
    ]

    return {
        "generated_at": end_dt.isoformat() + "Z",
        "tipe_station": tipe_station,
        "days": days,
        "start_date": start_dt.date().isoformat(),
        "end_date": end_dt.date().isoformat(),
        "daily": daily,
    }


def get_reporting_worst_stale(db: Session, hours: int = 24, limit: int = 20):
    now = datetime.utcnow()
    rows = (
        db.query(
            Station.id_station,
            Station.tipe_station,
            Station.name_station,
            Station.nama_kota,
            Station.is_active,
            StationLatest.status_realtime,
            StationLatest.last_observed_at,
            StationLatest.last_ingested_at,
            StationLatest.interval_detected,
        )
        .outerjoin(StationLatest, Station.id_station == StationLatest.id_station)
        .all()
    )

    items = []
    for row in rows:
        if row.last_observed_at is None:
            age_hours = None
            stale_score = 9999.0
        else:
            delta = now - row.last_observed_at.replace(tzinfo=None) if row.last_observed_at.tzinfo else now - row.last_observed_at
            age_hours = round(delta.total_seconds() / 3600, 2)
            stale_score = age_hours

        if age_hours is None or age_hours >= hours or (row.status_realtime in ["OFF", "DELAY"]):
            items.append(
                {
                    "id_station": row.id_station,
                    "tipe_station": row.tipe_station,
                    "name_station": row.name_station,
                    "nama_kota": row.nama_kota,
                    "is_active": row.is_active,
                    "status_realtime": row.status_realtime if row.status_realtime else "OFF",
                    "last_observed_at": row.last_observed_at.isoformat() if row.last_observed_at else None,
                    "last_ingested_at": row.last_ingested_at.isoformat() if row.last_ingested_at else None,
                    "interval_detected": row.interval_detected,
                    "age_hours": age_hours,
                    "stale_score": stale_score,
                }
            )

    items.sort(key=lambda item: item["stale_score"], reverse=True)

    return {
        "generated_at": now.isoformat() + "Z",
        "window_hours": hours,
        "items": items[:limit],
    }


def _observations_for_station_type(tipe_station: str):
    tipe = tipe_station.upper()
    if tipe == "ARG":
        return ObservationARG
    if tipe == "AWS":
        return ObservationAWS
    if tipe == "AAWS":
        return ObservationAAWS
    return None


def get_reporting_anomalies(db: Session, tipe_station: str | None = None, days: int = 7, limit: int = 50):
    now = datetime.utcnow()
    start_dt = now - timedelta(days=days)
    types = [tipe_station.upper()] if tipe_station else ["ARG", "AWS", "AAWS"]
    rows = []

    for tipe in types:
        obs_model = _observations_for_station_type(tipe)
        if obs_model is None:
            continue

        cols = [obs_model.rr]
        if hasattr(obs_model, "pp_air"):
            cols.append(obs_model.pp_air)
        if hasattr(obs_model, "rh_avg"):
            cols.append(obs_model.rh_avg)
        if hasattr(obs_model, "sr_avg"):
            cols.append(obs_model.sr_avg)
        if hasattr(obs_model, "ws_avg"):
            cols.append(obs_model.ws_avg)
        if hasattr(obs_model, "tt_air_avg"):
            cols.append(obs_model.tt_air_avg)

        query = (
            db.query(
                obs_model.id_station,
                obs_model.observed_at,
                obs_model.ingested_at,
                obs_model.rr,
                *(col for col in cols[1:] if col is not None),
            )
            .filter(
                obs_model.observed_at >= start_dt,
                obs_model.observed_at < now,
            )
            .order_by(obs_model.observed_at.desc())
            .limit(limit)
        )

        for row in query.all():
            data = row._asdict()
            suspect_fields = {}
            for key, value in data.items():
                if key in {"id_station", "observed_at", "ingested_at"}:
                    continue
                if value is None:
                    continue
                if isinstance(value, (int, float)) and (abs(value) > 1_000_000 or value != value):
                    suspect_fields[key] = value
                elif isinstance(value, (int, float)) and abs(value) > 500:
                    suspect_fields[key] = value

            if suspect_fields:
                rows.append(
                    {
                        "tipe_station": tipe,
                        "id_station": data["id_station"],
                        "observed_at": data["observed_at"].isoformat() if data["observed_at"] else None,
                        "ingested_at": data["ingested_at"].isoformat() if data["ingested_at"] else None,
                        "suspect_fields": suspect_fields,
                    }
                )

    rows.sort(key=lambda item: item["observed_at"], reverse=True)

    return {
        "generated_at": now.isoformat() + "Z",
        "days": days,
        "items": rows[:limit],
    }


def get_reporting_summary(db: Session, hours: int = 24, tipe_station: str | None = None):
    overview = get_reporting_overview(db, hours=hours)
    health = get_reporting_health_ranking(db, hours=hours, limit=5)
    stale = get_reporting_worst_stale(db, hours=hours, limit=10)
    anomalies = get_reporting_anomalies(db, tipe_station=tipe_station, days=max(1, hours // 24 or 1), limit=20)

    return {
        "overview": overview,
        "top_health": health["items"],
        "worst_stale": stale["items"],
        "anomalies": anomalies["items"],
        "report_hints": [
            "Use overview for executive summary.",
            "Use top_health to name the strongest stations.",
            "Use worst_stale to identify overdue devices.",
            "Use anomalies to detect suspicious values for manual review.",
        ],
    }
