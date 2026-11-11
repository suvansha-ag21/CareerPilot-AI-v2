from fastapi import APIRouter, Depends, File, Form, UploadFile
from app.core.security import verify_internal_key
from app.schemas.interview_schema import (
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    StartInterviewQuestionRequest,
    StartInterviewQuestionResponse,
    SummarizeInterviewRequest,
    SummarizeInterviewResponse,
    TranscribeAudioResponse,
)
from app.services.interview_engine import (
    evaluate_and_advance_interview,
    generate_opening_question,
    summarize_interview,
    transcribe_and_compute_metrics,
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


@router.post(
    "/interviews/transcribe-audio",
    response_model=TranscribeAudioResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def transcribe_interview_audio(
    audio: UploadFile = File(...),
    mime_type: str = Form("audio/webm"),
    duration_seconds: float = Form(0.0),
) -> TranscribeAudioResponse:
    raw_bytes = await audio.read()
    return await transcribe_and_compute_metrics(
        audio_bytes=raw_bytes,
        mime_type=mime_type,
        filename=audio.filename or "answer.webm",
        reported_duration_seconds=duration_seconds,
    )
