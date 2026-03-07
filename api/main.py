from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.config import settings
from api.db import init_pool, close_pool
from api.services.embedder import init_embedder

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_pool(settings.database_url)
    init_embedder(settings.embedding_model)
    yield
    # Shutdown
    await close_pool()

app = FastAPI(title="StatuteLens", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from api.routers import query, laws, sections, graph, voice, conversations
app.include_router(query.router, prefix="/api")
app.include_router(laws.router, prefix="/api")
app.include_router(sections.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(voice.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")

@app.get("/api/health")
async def health():
    from api.db import get_pool
    from api.services.embedder import get_embedder
    pool = get_pool()
    laws_count = await pool.fetchval("SELECT COUNT(*) FROM laws")
    sections_count = await pool.fetchval("SELECT COUNT(*) FROM sections")
    return {
        "status": "ok",
        "db": True,
        "embedding_model": get_embedder() is not None,
        "laws_count": laws_count,
        "sections_count": sections_count,
    }

# Serve React static build in production
# app.mount("/", StaticFiles(directory="static", html=True), name="static")
