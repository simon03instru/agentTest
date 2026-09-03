import json

from redis.redis import redis_client


def get_cache(key: str):
    """
    Ambil data dari Redis.
    Jika Redis bermasalah, return None
    sehingga API tetap bisa query database.
    """

    try:
        data = redis_client.get(key)

        if data is None:
            return None

        return json.loads(data)

    except Exception:
        return None


def set_cache(
    key: str,
    data,
    ttl: int = 15,
):
    """
    Simpan data ke Redis dengan TTL.
    """

    try:
        redis_client.setex(
            key,
            ttl,
            json.dumps(data, default=str),
        )

    except Exception:
        pass


def delete_cache(key: str):
    """
    Hapus cache tertentu.
    """

    try:
        redis_client.delete(key)

    except Exception:
        pass