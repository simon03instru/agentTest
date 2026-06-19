import os

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from db.db_connect import get_db
from services.query_logic import (
    get_reporting_overview,
    get_reporting_status_breakdown,
    get_reporting_freshness,
    get_reporting_health_ranking,
    get_reporting_daily_trend,
    get_reporting_worst_stale,
    get_reporting_anomalies,
    get_reporting_summary,
    get_reporting_station_detail,
)

router = APIRouter(prefix="/agent/report", tags=["Reporting"])


def require_reporting_key(x_agent_token: str | None = Header(default=None, alias="X-Agent-Token")):
    expected_token = os.getenv("REPORTING_API_KEY") or os.getenv("OPENCLAW_AUTH_TOKEN")

    if not expected_token:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Reporting API key is not configured",
        )

    if not x_agent_token or x_agent_token != expected_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid reporting token",
        )

    return True


@router.get("/overview")
def reporting_overview(
    hours: int = 24,
    db: Session = Depends(get_db),
    _: bool = Depends(require_reporting_key),
):
    return get_reporting_overview(db, hours=hours)


@router.get("/status-breakdown")
def reporting_status_breakdown(
    db: Session = Depends(get_db),
    _: bool = Depends(require_reporting_key),
):
    return get_reporting_status_breakdown(db)


@router.get("/freshness")
def reporting_freshness(
    hours: int = 24,
    db: Session = Depends(get_db),
    _: bool = Depends(require_reporting_key),
):
    return get_reporting_freshness(db, hours=hours)


@router.get("/health-ranking")
def reporting_health_ranking(
    hours: int = 24,
    limit: int = 20,
    db: Session = Depends(get_db),
    _: bool = Depends(require_reporting_key),
):
    return get_reporting_health_ranking(db, hours=hours, limit=limit)


@router.get("/daily-trend/{tipe_station}")
def reporting_daily_trend(
    tipe_station: str,
    days: int = 7,
    db: Session = Depends(get_db),
    _: bool = Depends(require_reporting_key),
):
    return get_reporting_daily_trend(db, tipe_station=tipe_station, days=days)


@router.get("/worst-stale")
def reporting_worst_stale(
    hours: int = 24,
    limit: int = 20,
    db: Session = Depends(get_db),
    _: bool = Depends(require_reporting_key),
):
    return get_reporting_worst_stale(db, hours=hours, limit=limit)


@router.get("/anomalies")
def reporting_anomalies(
    tipe_station: str | None = None,
    days: int = 7,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: bool = Depends(require_reporting_key),
):
    return get_reporting_anomalies(db, tipe_station=tipe_station, days=days, limit=limit)


@router.get("/summary")
def reporting_summary(
    hours: int = 24,
    tipe_station: str | None = None,
    db: Session = Depends(get_db),
    _: bool = Depends(require_reporting_key),
):
    return get_reporting_summary(db, hours=hours, tipe_station=tipe_station)


@router.get("/stations/{id_station}")
def reporting_station_detail(
    id_station: str,
    db: Session = Depends(get_db),
    _: bool = Depends(require_reporting_key),
):
    payload = get_reporting_station_detail(db, id_station)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station tidak ditemukan",
        )

    return payload
