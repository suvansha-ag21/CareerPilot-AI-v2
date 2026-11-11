from fastapi import APIRouter, Depends
from app.core.security import verify_internal_key
from app.schemas.interview_schema import (
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    StartInterviewQuestionRequest,
    StartInterviewQuestionResponse,
    SummarizeInterviewRequest,
    SummarizeInterviewResponse,
)
from app.services.interview_engine import (
    evaluate_and_advance_interview,
    generate_opening_question,
    summarize_interview,
)

router = APIRouter(tags=["Mock Interviews"])


@router.post(
    "/interviews/start-question",
    response_model=StartInterviewQuestionResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def start_interview_question(
    payload: StartInterviewQuestionRequest,
) -> StartInterviewQuestionResponse:
    return await generate_opening_question(payload)


@router.post(
    "/interviews/evaluate-and-next",
    response_model=EvaluateAnswerResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def evaluate_and_next(
    payload: EvaluateAnswerRequest,
) -> EvaluateAnswerResponse:
    return await evaluate_and_advance_interview(payload)


@router.post(
    "/interviews/summarize",
    response_model=SummarizeInterviewResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def summarize_interview_route(
    payload: SummarizeInterviewRequest,
) -> SummarizeInterviewResponse:
    return await summarize_interview(payload)
