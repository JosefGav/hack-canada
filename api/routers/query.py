from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse
from api.db import get_pool
from api.services.retrieval import hybrid_search
from api.services.rag import generate_response, generate_response_stream
from api.models.schemas import QueryRequest, QueryResponse
import json

router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    pool = get_pool()
    sections = await hybrid_search(req.query, pool, top_k=5, language=req.language, law_code=req.law_code)

    if not sections:
        return {"answer": None, "reason": "NO_RESULTS", "citations": [], "confidence": "low"}

    try:
        result = await generate_response(req.query, sections)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Gemini API error: {str(e)}")

    result["retrieved_sections"] = [
        {"lims_id": s.lims_id, "label": s.label, "law_code": s.law_code, "score": s.combined_score}
        for s in sections
    ]
    return result

@router.post("/query/stream")
async def query_stream(req: QueryRequest):
    pool = get_pool()
    sections = await hybrid_search(req.query, pool, top_k=5, language=req.language, law_code=req.law_code)

    if not sections:
        async def empty():
            yield {"event": "message", "data": json.dumps({
                "type": "done",
                "data": {"answer": None, "reason": "NO_RESULTS", "citations": [], "confidence": "low"}
            })}
        return EventSourceResponse(empty())

    async def event_generator():
        try:
            async for event in generate_response_stream(req.query, sections):
                yield {"event": "message", "data": json.dumps(event)}
        except Exception as e:
            yield {"event": "error", "data": json.dumps({"detail": f"Gemini API error: {str(e)}"})}

    return EventSourceResponse(event_generator())
