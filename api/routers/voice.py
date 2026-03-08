"""
Voice router — endpoints for ElevenLabs integration.

POST /api/voice/token  — signed WebSocket URL for Conversational AI
POST /api/voice/llm    — webhook called BY ElevenLabs agent
POST /api/voice/tts    — text-to-speech (type a question, hear it back)
GET  /api/voice/voices — list available ElevenLabs voices
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
import json

from api.services.voice import get_signed_url, text_to_speech, get_available_voices
from api.db import get_pool
from api.services.retrieval import hybrid_search
from api.services.rag import build_prompt
from api.config import settings
import google.generativeai as genai

router = APIRouter(prefix="/api/voice", tags=["voice"])

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-2.5-flash")

# ── Lawyer Voice Presets ──────────────────────────────────────────────
VOICE_PRESETS = [
    {
        "id": "assertive",
        "name": "The Advocate",
        "description": "Confident and direct — gets straight to the point",
        "voice_id": settings.ELEVENLABS_VOICE_ID,
        "persona_prompt": "TONE: You are assertive and confident. Be direct and decisive. Use phrases like \"The law is clear on this...\" or \"Under the statute, there is no ambiguity...\" Keep explanations sharp and to the point. You project authority.",
    },
    {
        "id": "analytical",
        "name": "The Scholar",
        "description": "Calm and precise — methodical legal analysis",
        "voice_id": "TBt8U1ufDfjfOcYYUUrU",
        "persona_prompt": "TONE: You are methodical and scholarly. Break down the analysis step by step. Use phrases like \"Let us examine this carefully...\" or \"The statute can be broken down into three key elements...\" You value precision and thoroughness.",
    },
    {
        "id": "empathetic",
        "name": "The Counselor",
        "description": "Warm and approachable — explains in plain language",
        "voice_id": "ErXwobaYiN019PkySvjV",
        "persona_prompt": "TONE: You are warm and approachable. Explain legal concepts as if talking to a friend. Use phrases like \"In simple terms, what this means for you is...\" or \"Don't worry, let me walk you through this...\" Prioritize making the law accessible and understandable.",
    },
]

# Build a lookup for persona prompts
PERSONA_PROMPTS = {p["id"]: p["persona_prompt"] for p in VOICE_PRESETS}


@router.get("/presets")
async def get_voice_presets():
    """Return available lawyer voice presets."""
    return {"presets": VOICE_PRESETS}


class TTSRequest(BaseModel):
    text: str
    voice_id: str | None = None


@router.post("/token")
async def voice_token():
    """Generate a signed WebSocket URL for ElevenLabs Conversational AI."""
    try:
        signed_url = await get_signed_url()
        return {"signed_url": signed_url}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to get signed URL: {str(e)}")


@router.post("/tts")
async def voice_tts(req: TTSRequest):
    """
    Convert text to speech using ElevenLabs TTS API.
    Returns raw MP3 audio that the browser can play directly.
    """
    if not req.text.strip():
        raise HTTPException(status_code=422, detail="Text cannot be empty")

    try:
        audio_bytes = await text_to_speech(req.text, req.voice_id)
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline"},
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"TTS failed: {str(e)}")


@router.get("/voices")
async def list_voices():
    """List all available ElevenLabs voices (useful for finding voice IDs)."""
    try:
        voices = await get_available_voices()
        return {"voices": voices}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to list voices: {str(e)}")


@router.post("/llm")
async def voice_llm(request: Request):
    """Called BY ElevenLabs agent as 'custom LLM'. Receives transcript, returns streamed text."""
    body = await request.json()
    messages = body.get("messages", [])
    user_message = messages[-1].get("content", "") if messages else ""
    
    if not user_message.strip():
        # Empty audio or payload
        async def empty_generate():
            yield "data: [DONE]\n\n"
        return StreamingResponse(empty_generate(), media_type="text/event-stream")

    pool = get_pool()
    sections = await hybrid_search(user_message, pool, top_k=5)

    prompt = build_prompt(user_message, sections)

    # ElevenLabs expects OpenAI-compatible SSE format
    async def generate():
        try:
            response = gemini_model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    # OpenAI SSE format for compatibility with ElevenLabs
                    data = {"choices": [{"delta": {"content": chunk.text}}]}
                    yield f"data: {json.dumps(data)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': f'Gemini API error: {str(e)}'})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/chat")
async def voice_chat(request: Request):
    """
    Full chat endpoint: takes a text question, returns a JSON response
    with the answer text. The frontend then calls /tts to hear it.

    This is the text-input workaround when mic is unavailable.
    """
    body = await request.json()
    question = body.get("question", "").strip()

    if not question:
        raise HTTPException(status_code=422, detail="Question cannot be empty")

    # TODO: Wire to RAG pipeline when ready.
    # For now, return a placeholder legal-sounding response.
    answer = generate_placeholder_answer(question)

    return {"answer": answer}


def generate_placeholder_answer(question: str) -> str:
    """
    Placeholder answer generator until the RAG pipeline is connected.
    Gives a legal-counsel-style response to demonstrate the voice.
    """
    q = question.lower()

    if "criminal" in q or "crime" in q:
        return (
            "Under the Criminal Code of Canada, R.S.C. 1985, c. C-46, "
            "criminal offences are categorized as summary conviction offences "
            "and indictable offences. The classification determines the procedure, "
            "available penalties, and limitation periods. I'd recommend reviewing "
            "the specific provisions relevant to your inquiry."
        )
    elif "tax" in q or "income" in q:
        return (
            "The Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), governs federal "
            "taxation in Canada. It establishes the rules for computing income, "
            "deductions, credits, and the obligations of taxpayers. For specific "
            "tax questions, I'd need to examine the relevant sections more closely."
        )
    elif "charter" in q or "rights" in q or "freedom" in q:
        return (
            "The Canadian Charter of Rights and Freedoms, Part I of the "
            "Constitution Act, 1982, guarantees fundamental rights including "
            "freedom of expression under Section 2(b), the right to life, liberty "
            "and security of the person under Section 7, and equality rights under "
            "Section 15. These rights are subject to reasonable limits under Section 1."
        )
    elif "immigration" in q or "citizen" in q:
        return (
            "Immigration matters in Canada are primarily governed by the "
            "Immigration and Refugee Protection Act, S.C. 2001, c. 27. "
            "The Act establishes categories for permanent residents, foreign workers, "
            "refugees, and sets out inadmissibility grounds and removal procedures."
        )
    else:
        return (
            f"That's an excellent question regarding {question}. "
            "Under Canadian federal law, this area would require a thorough "
            "review of the relevant statutes and regulations. Once our full "
            "legal research database is connected, I'll be able to provide "
            "specific statutory references and detailed analysis. "
            "Is there a particular aspect you'd like me to focus on?"
        )
