from pydantic import BaseModel, Field
from typing import Any, List, Optional
from datetime import date

# --- Query ---
class QueryRequest(BaseModel):
    query: str
    language: str = "en"
    law_code: Optional[str] = None
    conversation_id: Optional[str] = None

class CitationSchema(BaseModel):
    lims_id: str
    label: str
    law_code: str
    relevance: str
    hallucinated: bool = False

class RetrievedSectionSchema(BaseModel):
    lims_id: str
    label: str
    law_code: str
    score: float

class QueryResponse(BaseModel):
    answer: Optional[str]
    citations: List[CitationSchema] = []
    confidence: str = "low"
    reason: Optional[str] = None
    retrieved_sections: Optional[List[RetrievedSectionSchema]] = None

# --- Laws ---
class LawSummarySchema(BaseModel):
    code: str
    short_title_en: str
    type: str
    last_amended: Optional[date] = None
    section_count: int

class LawDetailSchema(BaseModel):
    id: int
    code: str
    type: str
    short_title_en: str
    short_title_fr: Optional[str] = None
    long_title_en: Optional[str] = None
    in_force: bool
    sections: List[dict]

# --- Graph ---
class GraphNodeSchema(BaseModel):
    code: str
    title: str

class GraphEdgeSchema(BaseModel):
    source: str
    target: str
    text: str

class GraphResponse(BaseModel):
    nodes: List[GraphNodeSchema]
    edges: List[GraphEdgeSchema]

# --- Voice ---
class VoiceTokenResponse(BaseModel):
    signed_url: str

class ConversationResponse(BaseModel):
    id: str
    created_at: str
