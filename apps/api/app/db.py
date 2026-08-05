from psycopg_pool import AsyncConnectionPool

from app.settings import get_settings

_pool: AsyncConnectionPool | None = None


def get_pool() -> AsyncConnectionPool:
    if _pool is None:
        raise RuntimeError("Connection pool is not open. Did the lifespan handler run?")
    return _pool


async def open_pool() -> AsyncConnectionPool:
    """Create the pool without connecting; the first query opens a connection.

    Not waiting here means the API still boots when Postgres is down, and
    /health reports it instead of the process dying at startup.
    """
    global _pool
    settings = get_settings()
    _pool = AsyncConnectionPool(
        conninfo=settings.database_url,
        min_size=settings.db_pool_min_size,
        max_size=settings.db_pool_max_size,
        open=False,
    )
    await _pool.open(wait=False)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def ping() -> bool:
    try:
        async with get_pool().connection(timeout=2) as conn:
            await conn.execute("SELECT 1")
        return True
    except Exception:
        return False
