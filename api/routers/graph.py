from fastapi import APIRouter
from api.db import get_pool
from api.models.schemas import GraphResponse

router = APIRouter()

@router.get("/graph/{code}", response_model=GraphResponse)
async def get_graph(code: str):
    pool = get_pool()
    # Get all cross-references from sections of this law
    rows = await pool.fetch("""
        SELECT DISTINCT
            l.code AS source_code, l.short_title_en AS source_title,
            cr->>'link' AS target_code, cr->>'text' AS ref_text
        FROM sections s
        JOIN laws l ON s.law_id = l.id,
        jsonb_array_elements(s.cross_refs) AS cr
        WHERE l.code = $1 AND cr->>'link' IS NOT NULL
    """, code)

    # Build nodes and edges
    nodes = {code: await pool.fetchval("SELECT short_title_en FROM laws WHERE code = $1", code)}
    edges = []
    for row in rows:
        target = row["target_code"]
        if target not in nodes:
            title = await pool.fetchval("SELECT short_title_en FROM laws WHERE code = $1", target)
            nodes[target] = title or target
        edges.append({"source": code, "target": target, "text": row["ref_text"]})

    return {
        "nodes": [{"code": k, "title": v} for k, v in nodes.items()],
        "edges": edges,
    }
