"""
Voice router — endpoints for ElevenLabs Conversational AI integration.

POST /api/voice/token  — returns a signed WebSocket URL for the frontend
POST /api/voice/llm    — webhook called BY ElevenLabs to get LLM responses
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from api.services.voice import get_signed_url

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.post("/token")
async def voice_token():
    """
    Generate a signed WebSocket URL for ElevenLabs Conversational AI.

    The frontend calls this to get a temporary URL, then connects directly
    to ElevenLabs via WebSocket. This keeps the API key server-side.
    """
    try:
        signed_url = await get_signed_url()
        return {"signed_url": signed_url}
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to get ElevenLabs signed URL: {str(e)}"
        )


@router.post("/llm")
async def voice_llm(request: Request):
    """
    Webhook endpoint called BY ElevenLabs when the agent needs an LLM response.

    ElevenLabs sends the user's transcribed speech here. We run it through
    our RAG pipeline and stream the response text back for TTS conversion.

    This endpoint is configured as the 'Server URL' in the ElevenLabs
    Agent dashboard under Custom LLM settings.
    """
    body = await request.json()
    messages = body.get("messages", [])

    # Extract the latest user message
    user_message = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            user_message = msg.get("content", "")
            break

    if not user_message:
        return StreamingResponse(
            iter(["I didn't catch that. Could you repeat your question?"]),
            media_type="text/plain"
        )

    # TODO: Wire this up to the RAG pipeline (retrieval.py → rag.py)
    # For now, return a placeholder response so voice works end-to-end.
    #
    # When the RAG service is ready, replace this with:
    #   from api.services.retrieval import hybrid_search
    #   from api.services.rag import generate_answer
    #   sections = await hybrid_search(user_message, language="en")
    #   answer_stream = generate_answer(user_message, sections, stream=True)
    #   return StreamingResponse(answer_stream, media_type="text/plain")

    async def placeholder_stream():
        yield f"You asked about: {user_message}. "
        yield "The RAG pipeline is not yet connected. "
        yield "Once the retrieval and Gemini services are ready, "
        yield "this endpoint will return real legal research answers."

    return StreamingResponse(
        placeholder_stream(),
        media_type="text/plain"
    )
