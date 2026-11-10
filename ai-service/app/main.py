from fastapi import FastAPI
from app.api.v1.health import router as health_router

app = FastAPI(
    title="CareerPilot AI Microservice",
    version="1.0.0",
    docs_url="/internal/ai/docs",
    openapi_url="/internal/ai/openapi.json",
)

app.include_router(health_router, prefix="/internal/ai/v1")


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "careerpilot-ai-service", "status": "running"}
