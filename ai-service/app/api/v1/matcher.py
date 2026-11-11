from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import BaseModel
from app.core.security import verify_internal_key
from app.pipelines.jd_matcher import extract_jd_text
from app.schemas.matcher_schema import JobMatchEvaluateResponse
from app.services.jd_match_service import evaluate_job_match_pipeline

router = APIRouter(tags=["Matcher"])


class JsonMatchRequest(BaseModel):
    user_id: str
    resume_id: str
    resume_text: str
    resume_skills: List[str]
    candidate_years: int = 0
    job_description: str
    target_role: Optional[str] = None
    company_name: Optional[str] = None


@router.post(
    "/matches/evaluate",
    response_model=JobMatchEvaluateResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def evaluate_match_multipart(
    user_id: str = Form(...),
    resume_id: str = Form(...),
    resume_text: str = Form(...),
    resume_skills_json: str = Form("[]"),
    candidate_years: int = Form(0),
    job_description: Optional[str] = Form(None),
    target_role: Optional[str] = Form(None),
    company_name: Optional[str] = Form(None),
    experience_level: Optional[str] = Form(None),
    job_type: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None),
) -> JobMatchEvaluateResponse:
    import json

    skills = json.loads(resume_skills_json) if resume_skills_json else []
    file_bytes = await jd_file.read() if jd_file else None
    file_ext = Path(jd_file.filename).suffix if jd_file and jd_file.filename else None

    resolved_jd = extract_jd_text(job_description, file_bytes, file_ext)
    return await evaluate_job_match_pipeline(
        user_id=user_id,
        resume_id=resume_id,
        resume_text=resume_text,
        resume_skills=skills,
        candidate_years=candidate_years,
        jd_text=resolved_jd,
        target_role_override=target_role,
        company_override=company_name,
        experience_level=experience_level,
        job_type=job_type,
    )
