# CHANGELOG

## Status: DB + ETL + Backend merged and tested

### [2026-03-07] Backend merge

- Merged `backend` branch into `database` — FastAPI API + RAG pipeline combined with ETL + schema
- Resolved port conflict: unified on port 5433, updated `config.py`, `docker-compose.yml`, `.env.example`
- Removed duplicate `init.sql` (using `migrations/001_init.sql` with `IF NOT EXISTS`)
- Removed committed `__pycache__/` files, added to `.gitignore`
- Fixed `LawSummarySchema.last_amended` type: `str` -> `date` (was causing /api/laws 500)
- Verified endpoints: `/api/health`, `/api/laws` (6 laws), `/api/sections/{lims_id}` all returning correct data

### [2026-03-07] Person 1 — Database & ETL setup

- Added `docker-compose.yml` — pgvector/pgvector:pg16 on port 5433
- Added `migrations/001_init.sql` — full schema: `laws`, `sections` (hnsw + FTS indexes), `conversations`, `messages`
- Added ETL pipeline: `__main__.py`, `ingest.py`, `xml_parser.py`, `text_extractor.py`, `embedder.py`
- Added `requirements.txt`, `.env.example`, `.gitignore`
- ETL `--start` complete: 6 laws, 2,767 sections, 100% embeddings + XML
- Hybrid search verified: vector (cosine) + FTS both return relevant Criminal Code sections

### Connection string for team
```
postgresql://dev:dev@localhost:5433/statutelens
```

### Working endpoints
- `GET /api/health` — DB + embedding model status
- `GET /api/laws` — all 6 laws with section counts
- `GET /api/laws/{code}` — single law with section list
- `GET /api/sections/{lims_id}` — full section with XML
- `POST /api/query` — RAG query (needs GEMINI_API_KEY)
- `POST /api/query/stream` — SSE streaming RAG query
- `GET /api/graph/{code}` — cross-reference graph
- `POST /api/voice/token` — ElevenLabs signed URL
- `POST /api/conversations` — create conversation

### Next steps
- [ ] Set GEMINI_API_KEY in `.env` and test `/api/query`
- [ ] Run `--full` if more coverage needed for demo
- [ ] Frontend integration
