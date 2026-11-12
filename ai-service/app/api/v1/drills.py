from fastapi import APIRouter, Depends
from app.core.security import verify_internal_key
from app.schemas.advanced_schema import (
    GenerateDrillsRequest,
    GenerateDrillsResponse,
)
from app.services.drill_generator import generate_flashcard_drills

router = APIRouter(tags=["Active-Recall Drills"])


@router.post(
    "/drills/generate",
    response_model=GenerateDrillsResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def generate_drills_route(
    payload: GenerateDrillsRequest,
) -> GenerateDrillsResponse:
    return await generate_flashcard_drills(payload)
