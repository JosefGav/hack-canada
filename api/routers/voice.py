from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from api.config import settings
from api.db import get_pool
from api.services.retrieval import hybrid_search
from api.services.rag import build_prompt
import httpx
import json
import google.generativeai as genai

router = APIRouter()

genai.configure(api_key=settings.gemini_api_key)
gemini_model = genai.GenerativeModel("gemini-2.0-flash")

@router.post("/voice/token")
async def get_voice_token():
    """Generate signed URL for ElevenLabs WebSocket (keeps API key server-side)."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.elevenlabs.io/v1/convai/conversation/get_signed_url",
            params={"agent_id": settings.elevenlabs_agent_id},
            headers={"xi-api-key": settings.elevenlabs_api_key},
        )
        resp.raise_for_status()
        return resp.json()

@router.post("/voice/llm")
async def voice_llm(request: Request):
    """Called BY ElevenLabs agent as 'custom LLM'. Receives transcript, returns streamed text."""
    body = await request.json()
    user_message = body.get("messages", [{}])[-1].get("content", "")

    pool = get_pool()
    sections = await hybrid_search(user_message, pool, top_k=5)

    prompt = build_prompt(user_message, sections)

    # ElevenLabs expects OpenAI-compatible SSE format
    async def generate():
        response = gemini_model.generate_content(prompt, stream=True)
        for chunk in response:
            if chunk.text:
                # OpenAI SSE format for compatibility with ElevenLabs
                data = {"choices": [{"delta": {"content": chunk.text}}]}
                yield f"data: {json.dumps(data)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
