from sentence_transformers import SentenceTransformer

_embedder: SentenceTransformer | None = None

def init_embedder(model_name: str):
    global _embedder
    _embedder = SentenceTransformer(model_name)

def get_embedder() -> SentenceTransformer:
    assert _embedder is not None
    return _embedder

def embed_query(text: str) -> list[float]:
    return get_embedder().encode(text).tolist()
