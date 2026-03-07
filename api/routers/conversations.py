from fastapi import APIRouter
from api.db import get_pool

router = APIRouter()

@router.post("/conversations")
async def create_conversation():
    pool = get_pool()
    row = await pool.fetchrow("INSERT INTO conversations DEFAULT VALUES RETURNING id, created_at")
    return dict(row)
