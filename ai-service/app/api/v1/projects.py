from fastapi import APIRouter, Depends
from app.core.security import verify_internal_key
from app.schemas.advanced_schema import (
    AnalyzeGitHubRepoRequest,
    AnalyzeGitHubRepoResponse,
)
from app.services.github_analyzer import analyze_github_repository

router = APIRouter(tags=["GitHub Projects"])


@router.post(
    "/projects/analyze-github",
    response_model=AnalyzeGitHubRepoResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def analyze_github_route(
    payload: AnalyzeGitHubRepoRequest,
) -> AnalyzeGitHubRepoResponse:
    return await analyze_github_repository(payload.repo_url)
