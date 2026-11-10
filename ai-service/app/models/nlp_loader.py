from functools import lru_cache
import spacy
from sentence_transformers import SentenceTransformer
from app.core.config import settings


@lru_cache(maxsize=1)
def get_spacy_nlp():
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        # Fallback minimal English pipeline if language model absent
        return spacy.blank("en")


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    return SentenceTransformer(settings.EMBEDDING_MODEL)
