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
from chatbot.cognee_client import (
    add_text as cognee_add_text,
    cognify as cognee_cognify,
    delete_dataset as cognee_delete_dataset,
    delete_dataset_data as cognee_delete_dataset_data,
    list_dataset_data as cognee_list_dataset_data,
    list_datasets as cognee_list_datasets,
    resolve_dataset as cognee_resolve_dataset,
    search as cognee_search,
)


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


@mcp.tool()
def tool_rag_station_knowledge(
    question: str,
    search_type: str = "HYBRID_COMPLETION",
) -> str:
    """Ambil konteks pengetahuan (SOP/manual/FAQ/insiden) dari Cognee RAG."""
    dataset = os.getenv("COGNEE_DATASET", "station_knowledge")
    dataset_info = cognee_resolve_dataset(dataset)
    result = cognee_search(
        query=question,
        dataset=dataset,
        search_type=search_type,
    )
    return json.dumps(
        {
            "dataset": dataset_info,
            "search_type": search_type,
            "result": result,
        },
        ensure_ascii=False,
    )


@mcp.tool()
def tool_knowledge_add(
    text: str,
    dataset: str | None = None,
    run_cognify: bool = True,
) -> str:
    """Tambah knowledge text ke Cognee lalu optional cognify."""
    target_dataset = dataset or os.getenv("COGNEE_DATASET", "station_knowledge")
    add_result = cognee_add_text(text=text, dataset=target_dataset)
    dataset_info = cognee_resolve_dataset(target_dataset)

    payload = {
        "dataset": dataset_info,
        "add_result": add_result,
    }

    if run_cognify:
        payload["cognify_result"] = cognee_cognify(dataset=target_dataset)

    return json.dumps(payload, ensure_ascii=False)


@mcp.tool()
def tool_knowledge_retrieve(
    query: str,
    dataset: str | None = None,
    search_type: str = "HYBRID_COMPLETION",
) -> str:
    """Retrieve knowledge dari Cognee dengan query semantic/hybrid."""
    target_dataset = dataset or os.getenv("COGNEE_DATASET", "station_knowledge")
    dataset_info = cognee_resolve_dataset(target_dataset)
    result = cognee_search(
        query=query,
        dataset=target_dataset,
        search_type=search_type,
    )
    return json.dumps(
        {
            "dataset": dataset_info,
            "query": query,
            "search_type": search_type,
            "result": result,
        },
        ensure_ascii=False,
    )


@mcp.tool()
def tool_knowledge_list_datasets() -> str:
    """List seluruh dataset knowledge yang tersedia di Cognee."""
    return json.dumps(cognee_list_datasets(), ensure_ascii=False)


@mcp.tool()
def tool_knowledge_list_data(dataset: str | None = None) -> str:
    """List seluruh item knowledge (data IDs) pada dataset."""
    target_dataset = dataset or os.getenv("COGNEE_DATASET", "station_knowledge")
    dataset_info = cognee_resolve_dataset(target_dataset)
    result = cognee_list_dataset_data(target_dataset)
    return json.dumps(
        {
            "dataset": dataset_info,
            "items": result,
        },
        ensure_ascii=False,
    )


@mcp.tool()
def tool_knowledge_delete_item(
    data_id: str,
    dataset: str | None = None,
    run_cognify: bool = True,
) -> str:
    """Hapus satu item knowledge berdasarkan data_id dari dataset."""
    target_dataset = dataset or os.getenv("COGNEE_DATASET", "station_knowledge")
    dataset_info = cognee_resolve_dataset(target_dataset)
    delete_result = cognee_delete_dataset_data(target_dataset, data_id)

    payload = {
        "dataset": dataset_info,
        "data_id": data_id,
        "delete_result": delete_result,
    }

    if run_cognify:
        payload["cognify_result"] = cognee_cognify(dataset=target_dataset)

    return json.dumps(payload, ensure_ascii=False)


@mcp.tool()
def tool_knowledge_delete_dataset(
    dataset: str,
) -> str:
    """Hapus satu dataset knowledge dari Cognee."""
    dataset_info = cognee_resolve_dataset(dataset)
    result = cognee_delete_dataset(dataset)
    return json.dumps(
        {
            "dataset": dataset_info,
            "delete_result": result,
        },
        ensure_ascii=False,
    )


if __name__ == "__main__":
    mcp.run(transport="stdio")
