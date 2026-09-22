import os
import mimetypes
from pathlib import Path
from typing import Any

import requests


def _cognee_base_url() -> str:
    return os.getenv("COGNEE_BASE_URL", "http://localhost:8000").rstrip("/")


def _cognee_headers() -> dict[str, str]:
    headers = {"Accept": "application/json"}
    api_key = os.getenv("COGNEE_API_KEY")
    if api_key:
        headers["X-API-Key"] = api_key
    bearer = os.getenv("COGNEE_BEARER_TOKEN")
    if bearer:
        headers["Authorization"] = f"Bearer {bearer}"
    return headers


def _request(
    method: str,
    path: str,
    *,
    json_payload: Any | None = None,
    data: Any | None = None,
    files: Any | None = None,
    params: dict[str, Any] | None = None,
):
    url = f"{_cognee_base_url()}{path}"
    try:
        response = requests.request(
            method=method.upper(),
            url=url,
            headers=_cognee_headers(),
            json=json_payload,
            data=data,
            files=files,
            params=params,
            timeout=60,
        )
        response.raise_for_status()
    except requests.HTTPError as exc:
        body = response.text.strip()
        raise RuntimeError(f"Cognee HTTP {response.status_code} on {path}: {body}") from exc
    except requests.RequestException as exc:
        raise RuntimeError(f"Failed to reach Cognee at {_cognee_base_url()}: {exc}") from exc

    if not response.content:
        return {}

    try:
        return response.json()
    except ValueError:
        return response.text


def _post_json(path: str, payload: Any):
    return _request("POST", path, json_payload=payload)


def _get_json(path: str):
    return _request("GET", path)


def _delete_json(path: str):
    return _request("DELETE", path)


def create_dataset(name: str):
    return _post_json("/api/v1/datasets", {"name": name})


def _dataset_items(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        datasets = payload.get("datasets")
        if isinstance(datasets, list):
            return [item for item in datasets if isinstance(item, dict)]
        return [payload]
    return []


def _dataset_id(item: dict[str, Any]) -> str | None:
    value = item.get("id") or item.get("dataset_id")
    return str(value) if value is not None else None


def _dataset_name(item: dict[str, Any]) -> str | None:
    value = item.get("name") or item.get("dataset_name")
    return str(value) if value is not None else None


def resolve_dataset(dataset_ref: str, create_if_missing: bool = False) -> dict[str, Any]:
    datasets = _dataset_items(list_datasets())
    for item in datasets:
        if _dataset_id(item) == dataset_ref or _dataset_name(item) == dataset_ref:
            return item

    if create_if_missing:
        created = create_dataset(dataset_ref)
        created_id = _dataset_id(created) if isinstance(created, dict) else None
        if created_id is not None:
            return created

        datasets = _dataset_items(list_datasets())
        for item in datasets:
            if _dataset_id(item) == dataset_ref or _dataset_name(item) == dataset_ref:
                return item

    raise RuntimeError(f"Cognee dataset not found: {dataset_ref}")


def resolve_dataset_id(dataset_ref: str, create_if_missing: bool = False) -> str:
    dataset = resolve_dataset(dataset_ref, create_if_missing=create_if_missing)
    dataset_id = _dataset_id(dataset)
    if dataset_id is None:
        raise RuntimeError(f"Cognee dataset is missing an id field: {dataset}")
    return dataset_id


def _build_add_files(items: list[str]) -> tuple[list[tuple[str, tuple[str, Any, str]]], list[Any]]:
    files: list[tuple[str, tuple[str, Any, str]]] = []
    opened_files: list[Any] = []

    for index, item in enumerate(items):
        candidate = os.fspath(item)
        if os.path.isfile(candidate):
            mime, _ = mimetypes.guess_type(candidate)
            handle = open(candidate, "rb")
            opened_files.append(handle)
            files.append(
                ("data", (Path(candidate).name, handle, mime or "application/octet-stream"))
            )
            continue

        files.append(
            (
                "data",
                (f"text_{index}.txt", candidate.encode("utf-8"), "text/plain"),
            )
        )

    return files, opened_files


def add_documents(documents: list[str], dataset: str | None = None):
    files, opened_files = _build_add_files(documents)
    form_data = {"datasetName": dataset or "main_dataset"}
    try:
        return _request("POST", "/api/v1/add", data=form_data, files=files)
    finally:
        for handle in opened_files:
            handle.close()


def add_text(text: str, dataset: str | None = None):
    return add_documents([text], dataset=dataset)


def cognify(dataset: str | None = None):
    payload: dict[str, Any] = {}
    if dataset:
        payload["dataset_ids"] = [resolve_dataset_id(dataset, create_if_missing=False)]
    return _post_json("/api/v1/cognify", payload)


def search(
    query: str,
    dataset: str | None = None,
    search_type: str = "HYBRID_COMPLETION",
    top_k: int = 15,
):
    payload = {
        "query": query,
        "search_type": search_type,
        "top_k": top_k,
    }
    if dataset:
        payload["dataset_ids"] = [resolve_dataset_id(dataset, create_if_missing=False)]
    return _post_json("/api/v1/search", payload)


def list_datasets():
    return _get_json("/api/v1/datasets")


def list_dataset_data(dataset_ref: str):
    dataset_id = resolve_dataset_id(dataset_ref, create_if_missing=False)
    return _get_json(f"/api/v1/datasets/{dataset_id}/data")


def delete_dataset(dataset_ref: str):
    dataset_id = resolve_dataset_id(dataset_ref, create_if_missing=False)
    return _delete_json(f"/api/v1/datasets/{dataset_id}")


def delete_dataset_data(dataset_ref: str, data_id: str):
    dataset_id = resolve_dataset_id(dataset_ref, create_if_missing=False)
    return _delete_json(f"/api/v1/datasets/{dataset_id}/data/{data_id}")
