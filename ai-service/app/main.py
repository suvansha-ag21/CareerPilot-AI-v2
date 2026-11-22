import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from app.api.v1.health import router as health_router
from app.api.v1.resumes import router as resumes_router
from app.api.v1.matcher import router as matcher_router
from app.api.v1.skills import router as skills_router
from app.api.v1.interviews import router as interviews_router
from app.api.v1.projects import router as projects_router
from app.api.v1.drills import router as drills_router
from app.core.llm_provider import get_llm_telemetry, reset_llm_telemetry
from app.rag.vector_store import vector_store


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        vector_store.ensure_cs_kb_indexed()
    except Exception:
        # Defer KB indexing cleanly if embedding model initializes lazily
        pass
    yield


app = FastAPI(
    title="CareerPilot AI Microservice",
    version="1.0.0",
    docs_url="/internal/ai/docs",
    openapi_url="/internal/ai/openapi.json",
    lifespan=lifespan,
)


@app.middleware("http")
async def attach_ai_telemetry_headers(request: Request, call_next):
    token = reset_llm_telemetry()
    started = time.perf_counter()
    try:
        response = await call_next(request)
        total_ms = int((time.perf_counter() - started) * 1000)
        tele = get_llm_telemetry()
        if tele:
            response.headers["X-AI-Provider"] = tele["provider"]
            response.headers["X-AI-Model"] = tele["model"]
            response.headers["X-AI-Latency-Ms"] = tele["latency_ms"]
            response.headers["X-AI-Fallback-Used"] = tele["fallback_used"]
        else:
            response.headers["X-AI-Latency-Ms"] = str(total_ms)
        return response
    finally:
        # ContextVar reset not strictly required per async task, safe to leave clean
        _ = token


app.include_router(health_router, prefix="/internal/ai")
app.include_router(resumes_router, prefix="/internal/ai")
app.include_router(matcher_router, prefix="/internal/ai")
app.include_router(skills_router, prefix="/internal/ai")
app.include_router(interviews_router, prefix="/internal/ai")
app.include_router(projects_router, prefix="/internal/ai")
app.include_router(drills_router, prefix="/internal/ai")


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "careerpilot-ai-service", "status": "running"}


@app.get("/health")
async def health() -> dict[str, object]:
    return {
        "status": "ok",
        "healthy": True,
        "service": "careerpilot-ai-service",
    }
