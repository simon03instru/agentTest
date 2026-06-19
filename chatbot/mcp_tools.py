from pathlib import Path
import json
import os
import sys
from datetime import date
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from fastmcp import FastMCP


mcp = FastMCP("ReportingTools")


def _backend_base_url() -> str:
    return (
        os.getenv("BACKEND_BASE_URL")
        or os.getenv("hostbackend")
        or os.getenv("HOSTBACKEND")
        or "http://localhost:8009"
    ).rstrip("/")


def _agent_token() -> str:
    token = os.getenv("REPORTING_API_KEY") or os.getenv("OPENCLAW_AUTH_TOKEN")
    if not token:
        raise RuntimeError("REPORTING_API_KEY or OPENCLAW_AUTH_TOKEN must be set")
    return token


def _request_json(path: str, params: dict | None = None):
    base_url = _backend_base_url()
    query = f"?{urlencode(params)}" if params else ""
    url = f"{base_url}{path}{query}"
    request = Request(url)
    request.add_header("X-Agent-Token", _agent_token())

    try:
        with urlopen(request, timeout=30) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload)
    except HTTPError as exc:
        body = exc.read().decode("utf-8") if exc.fp else str(exc)
        raise RuntimeError(f"HTTP {exc.code} calling {path}: {body}") from exc
    except URLError as exc:
        raise RuntimeError(f"Failed to reach backend at {base_url}: {exc.reason}") from exc


@mcp.tool()
def tool_get_summary() -> str:
    """Ambil ringkasan realtime station dari FastAPI reporting endpoint."""
    return json.dumps(_request_json("/agent/report/summary", {"hours": 24}), ensure_ascii=False)


@mcp.tool()
def tool_get_overview(hours: int = 24) -> str:
    """Ambil overview realtime station dari FastAPI reporting endpoint."""
    return json.dumps(_request_json("/agent/report/overview", {"hours": hours}), ensure_ascii=False)


@mcp.tool()
def tool_get_status_breakdown() -> str:
    """Ambil breakdown status realtime per tipe station."""
    return json.dumps(_request_json("/agent/report/status-breakdown"), ensure_ascii=False)


@mcp.tool()
def tool_get_freshness(hours: int = 24) -> str:
    """Ambil daftar station berdasarkan tingkat kesegaran data."""
    return json.dumps(_request_json("/agent/report/freshness", {"hours": hours}), ensure_ascii=False)


@mcp.tool()
def tool_get_health_ranking(hours: int = 24, limit: int = 20) -> str:
    """Ambil ranking kesehatan station."""
    return json.dumps(_request_json("/agent/report/health-ranking", {"hours": hours, "limit": limit}), ensure_ascii=False)


@mcp.tool()
def tool_get_worst_stale(hours: int = 24, limit: int = 20) -> str:
    """Ambil ranking station paling stale atau bermasalah."""
    return json.dumps(_request_json("/agent/report/worst-stale", {"hours": hours, "limit": limit}), ensure_ascii=False)


@mcp.tool()
def tool_get_anomalies(tipe_station: str | None = None, days: int = 7, limit: int = 50) -> str:
    """Ambil kandidat anomali dari data observasi historis."""
    params = {"days": days, "limit": limit}
    if tipe_station:
        params["tipe_station"] = tipe_station
    return json.dumps(_request_json("/agent/report/anomalies", params), ensure_ascii=False)


@mcp.tool()
def tool_get_daily_trend(tipe_station: str, days: int = 7) -> str:
    """Ambil tren harian observasi berdasarkan tipe station."""
    return json.dumps(_request_json(f"/agent/report/daily-trend/{tipe_station}", {"days": days}), ensure_ascii=False)


@mcp.tool()
def tool_get_station_detail(id_station: str) -> str:
    """Ambil detail station dari FastAPI reporting endpoint."""
    return json.dumps(_request_json(f"/agent/report/stations/{id_station}"), ensure_ascii=False)


@mcp.tool()
def tool_get_percentage_id_station(id_station: str, tanggal: date) -> str:
    """Ambil detail data persentase alat berdasarkan tanggal."""
    params = {"tanggal": tanggal.isoformat()}
    return json.dumps(_request_json(f"/percentage/{id_station}", params), ensure_ascii=False)


@mcp.tool()
def tool_get_off_stations(tipe_station: str | None = None) -> str:
    """Ambil daftar station yang OFF, DELAY, atau NO DATA dari backend FastAPI."""
    params = {}
    if tipe_station:
        params["tipe_station"] = tipe_station
    return json.dumps(_request_json("/off", params), ensure_ascii=False)


@mcp.tool()
def tool_get_realtime_status(tipe_station: str | None = None, status_realtime: str | None = None) -> str:
    """Ambil status realtime semua station."""
    params = {}
    if tipe_station:
        params["tipe_station"] = tipe_station
    if status_realtime:
        params["status_realtime"] = status_realtime
    return json.dumps(_request_json("/status", params), ensure_ascii=False)


if __name__ == "__main__":
    mcp.run(transport="stdio")
