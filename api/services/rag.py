import google.generativeai as genai
import json
from api.config import settings
from api.services.retrieval import SectionResult

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

SYSTEM_PROMPT = """You are a legal research assistant specializing in Canadian federal statutes and regulations.

RULES:
1. ONLY use the statutory excerpts in the CONTEXT BLOCKS below. Do NOT use your general knowledge or training data.
2. If the excerpts do not contain the answer, say: "I could not find information on this topic in the loaded federal statutes. Try rephrasing your question or ask about a specific act (e.g. Criminal Code, Charter of Rights)."
3. When citing specific statutory text, use [Section X] notation referencing the provided excerpts.
4. Use precise legal language, then explain in plain English.
5. Never fabricate or invent statutory content. Only quote what is in the CONTEXT BLOCKS.

RESPONSE FORMAT (strict JSON, no markdown fences):
{
  "answer": "Your answer with [Section X(Y)] citations inline...",
  "citations": [
    {"lims_id": "12345", "label": "37(1)", "law_code": "I-5", "relevance": "high"}
  ],
  "confidence": "high"
}

CONFIDENCE LEVELS:
- "high": Answer is directly and fully supported by the excerpts
- "medium": Answer is partially supported by the excerpts
- "low": Excerpts are only tangentially relevant — tell the user the statutes may not cover this topic"""


def build_prompt(query: str, sections: list[SectionResult], persona: str | None = None) -> str:
    context_blocks = "\n---\n".join(
        f"[{s.law_title} | Section {s.label} | lims_id: {s.lims_id}]\n{s.content_text}"
        for s in sections
    )
    persona_block = f"\n\n{persona}" if persona else ""
    return f"""{SYSTEM_PROMPT}{persona_block}

CONTEXT BLOCKS:
{context_blocks}

USER QUESTION: {query}"""


async def generate_response(query: str, sections: list[SectionResult], persona: str | None = None) -> dict:
    prompt = build_prompt(query, sections, persona)
    response = model.generate_content(
        prompt, 
        generation_config={"response_mime_type": "application/json"}
    )
    raw = response.text.strip()

    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = {"answer": raw, "citations": [], "confidence": "low"}

    retrieved_lims_ids = {s.lims_id for s in sections}
    validated_citations = []
    for c in parsed.get("citations", []):
        c["hallucinated"] = c.get("lims_id") not in retrieved_lims_ids
        validated_citations.append(c)
    parsed["citations"] = validated_citations

    if any(c["hallucinated"] for c in validated_citations):
        parsed["confidence"] = "low"

    return parsed


async def generate_response_stream(query: str, sections: list[SectionResult], persona: str | None = None):
    prompt = build_prompt(query, sections, persona)
    response = model.generate_content(
        prompt, 
        stream=True, 
        generation_config={"response_mime_type": "application/json"}
    )
    full_text = ""
    for chunk in response:
        if chunk.text:
            full_text += chunk.text
            yield {"type": "token", "data": chunk.text}

    raw = full_text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    try:
        parsed = json.loads(raw)
        retrieved_lims_ids = {s.lims_id for s in sections}
        for c in parsed.get("citations", []):
            c["hallucinated"] = c.get("lims_id") not in retrieved_lims_ids
        yield {"type": "citations", "data": parsed.get("citations", [])}
        yield {"type": "confidence", "data": parsed.get("confidence", "low")}
    except json.JSONDecodeError:
        yield {"type": "citations", "data": []}
        yield {"type": "confidence", "data": "low"}

    yield {"type": "done", "data": None}
