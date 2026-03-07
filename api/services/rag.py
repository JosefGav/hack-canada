import google.generativeai as genai
import json
from api.config import settings
from api.services.retrieval import SectionResult

genai.configure(api_key=settings.gemini_api_key)
model = genai.GenerativeModel("gemini-2.5-flash")

SYSTEM_PROMPT = """You are a legal research assistant analyzing Canadian federal statutes and regulations.

STRICT RULES:
1. Answer ONLY using the statutory excerpts provided in the CONTEXT BLOCKS below.
2. Every factual claim must cite the specific section using [Section X] notation.
3. If the provided excerpts do not contain enough information to answer the question,
   respond with: {"answer": null, "reason": "INSUFFICIENT_CONTEXT", "citations": []}
4. Do NOT synthesize information beyond what the excerpts explicitly state.
5. Use precise legal language, then explain in plain English.

RESPONSE FORMAT (strict JSON, no markdown fences):
{
  "answer": "Your answer with [Section X(Y)] citations inline...",
  "citations": [
    {"lims_id": "12345", "label": "37(1)", "law_code": "I-5", "relevance": "high"}
  ],
  "confidence": "high"
}

CONFIDENCE LEVELS:
- "high": Answer is directly stated in the excerpts
- "medium": Answer requires reasonable inference from the excerpts
- "low": Answer is partially supported; some aspects not covered"""


def build_prompt(query: str, sections: list[SectionResult]) -> str:
    context_blocks = "\n---\n".join(
        f"[{s.law_title} | Section {s.label} | lims_id: {s.lims_id}]\n{s.content_text}"
        for s in sections
    )
    return f"""{SYSTEM_PROMPT}

CONTEXT BLOCKS:
{context_blocks}

USER QUESTION: {query}"""


async def generate_response(query: str, sections: list[SectionResult]) -> dict:
    prompt = build_prompt(query, sections)
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


async def generate_response_stream(query: str, sections: list[SectionResult]):
    prompt = build_prompt(query, sections)
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
