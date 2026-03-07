import asyncpg

pool: asyncpg.Pool | None = None

async def init_pool(database_url: str):
    global pool
    pool = await asyncpg.create_pool(database_url, min_size=2, max_size=10)

async def close_pool():
    global pool
    if pool:
        await pool.close()

def get_pool() -> asyncpg.Pool:
    assert pool is not None, "Database pool not initialized"
    return pool
