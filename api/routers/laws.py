from fastapi import APIRouter, HTTPException
from api.db import get_pool
from api.models.schemas import LawSummarySchema, LawDetailSchema
from typing import List

router = APIRouter()

@router.get("/laws", response_model=List[LawSummarySchema])
async def list_laws():
    pool = get_pool()
    rows = await pool.fetch("""
        SELECT l.code, l.short_title_en, l.type, l.last_amended,
               COUNT(s.id) as section_count
        FROM laws l LEFT JOIN sections s ON s.law_id = l.id
        GROUP BY l.id ORDER BY l.code
    """)
    return [dict(row) for row in rows]

@router.get("/laws/{code}", response_model=LawDetailSchema)
async def get_law(code: str):
    pool = get_pool()
    law = await pool.fetchrow("SELECT * FROM laws WHERE code = $1", code)
    if not law:
        raise HTTPException(404, f"Law {code} not found")
    sections = await pool.fetch("""
        SELECT lims_id, label, marginal_note, chunk_type
        FROM sections WHERE law_id = $1 AND language = 'en'
        ORDER BY id
    """, law["id"])
    return {**dict(law), "sections": [dict(s) for s in sections]}
