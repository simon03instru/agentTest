import json

from core.cache_redis import redis_client
from fastapi.encoders import jsonable_encoder


def normalize_for_cache(data):
    """
    Mengubah data menjadi format yang aman disimpan sebagai JSON.

    Mendukung:
    - SQLAlchemy Row
    - Pydantic model
    - list
    - tuple
    - dictionary
    """

    # SQLAlchemy Row
    if hasattr(data, "_mapping"):
        return dict(data._mapping)

    # Pydantic v2
    if hasattr(data, "model_dump"):
        return data.model_dump()

    # List atau tuple
    if isinstance(data, (list, tuple)):
        return [
            normalize_for_cache(item)
            for item in data
        ]

    # Dictionary
    if isinstance(data, dict):
        return {
            key: normalize_for_cache(value)
            for key, value in data.items()
        }

    return data


def get_cache(key: str):
    """
    Ambil data dari Redis.

    Jika key tidak ada atau Redis bermasalah,
    return None sehingga API tetap bisa query database.
    """

    try:
        data = redis_client.get(key)

        if data is None:
            return None

        # Jika Redis mengembalikan bytes
        if isinstance(data, bytes):
            data = data.decode("utf-8")

        return json.loads(data)

    except Exception as e:
        print(f"[CACHE GET ERROR] {key}: {e}")
        return None


def set_cache(key: str, data, ttl: int = 15):
    """
    Simpan data JSON-compatible ke Redis dengan TTL.
    """

    try:
        normalized_data = normalize_for_cache(data)
        json_data = jsonable_encoder(normalized_data)
        redis_client.setex(
            key,
            ttl,
            json.dumps(json_data),
        )

    except Exception as e:
        print(f"[CACHE SET ERROR] {key}: {e}")


def delete_cache(key: str):
    """
    Hapus cache tertentu.
    """

    try:
        redis_client.delete(key)

    except Exception as e:
        print(f"[CACHE DELETE ERROR] {key}: {e}")