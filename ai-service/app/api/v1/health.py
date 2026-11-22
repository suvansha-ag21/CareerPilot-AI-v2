from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.config import settings
from app.core.security import verify_internal_key

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: str
    healthy: bool = True
    service: str
    llm_provider: str
    llm_configured: bool
    embedding_model: str


@router.get("/health", response_model=HealthResponse, dependencies=[Depends(verify_internal_key)])
async def get_health() -> HealthResponse:
    llm_ready = bool(
        (settings.LLM_PROVIDER == "gemini" and settings.GEMINI_API_KEY)
        or (settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY)
    )
    return HealthResponse(
        status="ok",
        healthy=True,
        service="careerpilot-ai-service",
        llm_provider=settings.LLM_PROVIDER,
        llm_configured=llm_ready,
        embedding_model=settings.EMBEDDING_MODEL,
    )
