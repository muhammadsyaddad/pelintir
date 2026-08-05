from functools import lru_cache

from meilisearch import Client
from starlette.concurrency import run_in_threadpool

from app.settings import get_settings


@lru_cache
def get_client() -> Client:
    settings = get_settings()
    return Client(settings.meili_url, settings.meili_master_key, timeout=2)


def _is_available() -> bool:
    try:
        return get_client().is_healthy()
    except Exception:
        return False


async def ping() -> bool:
    """The meilisearch client is synchronous, so keep it off the event loop."""
    return await run_in_threadpool(_is_available)
