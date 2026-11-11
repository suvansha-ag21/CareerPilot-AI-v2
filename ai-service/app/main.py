from fastapi import FastAPI
from app.api.v1.health import router as health_router
from app.api.v1.resumes import router as resumes_router
from app.api.v1.matcher import router as matcher_router

app = FastAPI(
    title="CareerPilot AI Microservice",
    version="1.0.0",
    docs_url="/internal/ai/docs",
    openapi_url="/internal/ai/openapi.json",
)

app.include_router(health_router, prefix="/internal/ai")
app.include_router(resumes_router, prefix="/internal/ai")
app.include_router(matcher_router, prefix="/internal/ai")


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "careerpilot-ai-service", "status": "running"}
