import json

from core.cache_redis import redis_client


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
        # Pydantic v2
        if hasattr(data, "model_dump"):
            data = data.model_dump()

        # List Pydantic objects
        elif isinstance(data, list):
            data = [
                item.model_dump() if hasattr(item, "model_dump") else item
                for item in data
            ]

        redis_client.setex(
            key,
            ttl,
            json.dumps(data, default=str),
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