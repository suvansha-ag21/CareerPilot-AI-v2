from fastapi import APIRouter, Depends, File, Form, UploadFile
from app.core.security import verify_internal_key
from app.rag.vector_store import vector_store
from app.schemas.resume_schema import (
    ResumeAnalyzeResponse,
    TailorResumeRequest,
    TailorResumeResponse,
    VectorDeleteRequest,
)
from app.services.resume_analyzer import analyze_resume_pipeline, tailor_resume_for_role

router = APIRouter(tags=["Resumes"])


@router.post(
    "/resumes/parse-and-evaluate",
    response_model=ResumeAnalyzeResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def parse_and_evaluate_resume(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    resume_id: str = Form(...),
    target_role: str = Form("Full Stack Developer"),
    experience_level: str = Form("Fresher"),
    analysis_type: str = Form("COMPLETE_ANALYSIS"),
    file_type: str = Form("PDF"),
) -> ResumeAnalyzeResponse:
    file_bytes = await file.read()
    return await analyze_resume_pipeline(
        user_id=user_id,
        resume_id=resume_id,
        target_role=target_role,
        experience_level=experience_level,
        analysis_type=analysis_type,
        file_type=file_type,
        file_bytes=file_bytes,
    )


@router.post("/resumes/vectors/delete", dependencies=[Depends(verify_internal_key)])
async def delete_resume_vectors(payload: VectorDeleteRequest) -> dict[str, bool]:
    vector_store.delete_resume_chunks(user_id=payload.user_id, resume_id=payload.resume_id)
    return {"deleted": True}


@router.post(
    "/resumes/tailor",
    response_model=TailorResumeResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def tailor_resume_route(payload: TailorResumeRequest) -> TailorResumeResponse:
    return await tailor_resume_for_role(payload)
