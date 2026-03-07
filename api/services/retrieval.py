import asyncpg
from api.services.embedder import embed_query
from dataclasses import dataclass

@dataclass
class SectionResult:
    id: int
    content_text: str
    content_xml: str | None
    label: str
    marginal_note: str | None
    lims_id: str
    law_id: int
    chunk_type: str
    definitions: list
    cross_refs: list
    law_code: str
    law_title: str
    combined_score: float

HYBRID_SEARCH_SQL = """
WITH vector_results AS (
    SELECT s.id, s.content_text, s.content_xml, s.label, s.marginal_note,
           s.lims_id, s.law_id, s.chunk_type, s.definitions, s.cross_refs,
           l.code AS law_code, l.short_title_en AS law_title,
           1 - (s.embedding <=> $1::vector) AS vector_score
    FROM sections s
    JOIN laws l ON s.law_id = l.id
    WHERE s.language = $2
      AND ($3::varchar IS NULL OR l.code = $3)
    ORDER BY s.embedding <=> $1::vector
    LIMIT 20
),
fts_results AS (
    SELECT s.id, s.content_text, s.content_xml, s.label, s.marginal_note,
           s.lims_id, s.law_id, s.chunk_type, s.definitions, s.cross_refs,
           l.code AS law_code, l.short_title_en AS law_title,
           ts_rank_cd(s.content_tsv, plainto_tsquery('english', $4)) AS fts_score
    FROM sections s
    JOIN laws l ON s.law_id = l.id
    WHERE s.content_tsv @@ plainto_tsquery('english', $4)
      AND s.language = $2
      AND ($3::varchar IS NULL OR l.code = $3)
    ORDER BY fts_score DESC
    LIMIT 20
),
combined AS (
    SELECT COALESCE(v.id, f.id) AS id,
           COALESCE(v.content_text, f.content_text) AS content_text,
           COALESCE(v.content_xml, f.content_xml) AS content_xml,
           COALESCE(v.label, f.label) AS label,
           COALESCE(v.marginal_note, f.marginal_note) AS marginal_note,
           COALESCE(v.lims_id, f.lims_id) AS lims_id,
           COALESCE(v.law_id, f.law_id) AS law_id,
           COALESCE(v.chunk_type, f.chunk_type) AS chunk_type,
           COALESCE(v.definitions, f.definitions) AS definitions,
           COALESCE(v.cross_refs, f.cross_refs) AS cross_refs,
           COALESCE(v.law_code, f.law_code) AS law_code,
           COALESCE(v.law_title, f.law_title) AS law_title,
           COALESCE(v.vector_score, 0) * 0.7
           + COALESCE(f.fts_score, 0) * 0.3 AS combined_score
    FROM vector_results v
    FULL OUTER JOIN fts_results f ON v.id = f.id
)
SELECT * FROM combined ORDER BY combined_score DESC LIMIT $5;
"""

async def hybrid_search(
    query: str,
    pool: asyncpg.Pool,
    top_k: int = 5,
    language: str = "en",
    law_code: str | None = None,
) -> list[SectionResult]:
    query_embedding = embed_query(query)
    embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
    rows = await pool.fetch(
        HYBRID_SEARCH_SQL,
        embedding_str, language, law_code, query, top_k
    )
    return [SectionResult(**dict(row)) for row in rows]
