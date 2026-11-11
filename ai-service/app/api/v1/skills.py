from fastapi import APIRouter, Depends
from app.core.security import verify_internal_key
from app.pipelines.skill_gap_analyzer import run_skill_gap_analysis
from app.schemas.skills_schema import (
    AnalyzeSkillGapRequest,
    AnalyzeSkillGapResponse,
    GenerateRoadmapRequest,
    GenerateRoadmapResponse,
)
from app.services.roadmap_generator import generate_personalized_roadmap

router = APIRouter(tags=["Skills & Roadmap"])


@router.post(
    "/skills/analyze-gap",
    response_model=AnalyzeSkillGapResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def analyze_skill_gap(payload: AnalyzeSkillGapRequest) -> AnalyzeSkillGapResponse:
    return await run_skill_gap_analysis(payload)


@router.post(
    "/roadmap/generate",
    response_model=GenerateRoadmapResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def create_roadmap_plan(payload: GenerateRoadmapRequest) -> GenerateRoadmapResponse:
    return await generate_personalized_roadmap(payload)
