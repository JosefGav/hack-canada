from fastapi import APIRouter, HTTPException
from api.db import get_pool

router = APIRouter()

@router.get("/sections/{lims_id}")
async def get_section(lims_id: str):
    pool = get_pool()
    row = await pool.fetchrow("""
        SELECT s.*, l.code AS law_code, l.short_title_en AS law_title
        FROM sections s JOIN laws l ON s.law_id = l.id
        WHERE s.lims_id = $1
    """, lims_id)
    if not row:
        raise HTTPException(404, f"Section {lims_id} not found")
    return dict(row)
