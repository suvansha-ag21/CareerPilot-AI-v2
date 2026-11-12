from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class ResumeContact(BaseModel):
    candidateName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    githubUrl: Optional[str] = None
    linkedinUrl: Optional[str] = None
    portfolioUrl: Optional[str] = None


class ResumeEducationEntry(BaseModel):
    institution: str
    degree: str
    field: Optional[str] = None
    duration: Optional[str] = None
    grade: Optional[str] = None


class ResumeExperienceEntry(BaseModel):
    company: str
    role: str
    duration: Optional[str] = None
    highlights: List[str] = Field(default_factory=list)


class ResumeProjectEntry(BaseModel):
    title: str
    techStack: List[str] = Field(default_factory=list)
    highlights: List[str] = Field(default_factory=list)


class ParsedResumeData(BaseModel):
    contact: ResumeContact
    summary: Optional[str] = None
    education: List[ResumeEducationEntry] = Field(default_factory=list)
    experience: List[ResumeExperienceEntry] = Field(default_factory=list)
    projects: List[ResumeProjectEntry] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    sectionsDetected: List[str] = Field(default_factory=list)
    wordCount: int = 0


class SectionEvaluation(BaseModel):
    section: str
    score: float = Field(ge=0, le=100)
    status: Literal["STRONG", "NEEDS_WORK", "MISSING"]
    summary: str
    suggestions: List[str] = Field(default_factory=list)


class BulletSuggestion(BaseModel):
    original: str
    improved: str
    reason: str


class ResumeFeedbackReport(BaseModel):
    scoringMethodologyNote: str
    analysisType: Optional[str] = None
    targetRoleUsed: Optional[str] = None
    experienceLevelUsed: Optional[str] = None
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    missingKeywords: List[str] = Field(default_factory=list)
    missingSections: List[str] = Field(default_factory=list)
    unnecessaryInfo: List[str] = Field(default_factory=list)
    formattingSuggestions: List[str] = Field(default_factory=list)
    summarySuggestion: str = ""
    bulletSuggestions: List[BulletSuggestion] = Field(default_factory=list)


class ResumeLLMExtractionAndCritique(BaseModel):
    """Structured output returned by LLM for resume section structuring and qualitative review."""
    candidate_name: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    education: List[ResumeEducationEntry] = Field(default_factory=list)
    experience: List[ResumeExperienceEntry] = Field(default_factory=list)
    projects: List[ResumeProjectEntry] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    additional_skills: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    missing_keywords: List[str] = Field(default_factory=list)
    unnecessary_info: List[str] = Field(default_factory=list)
    formatting_suggestions: List[str] = Field(default_factory=list)
    summary_suggestion: str = ""
    bullet_suggestions: List[BulletSuggestion] = Field(default_factory=list)


class ResumeAnalyzeResponse(BaseModel):
    extracted_text: str
    parsed_data: ParsedResumeData
    skills: List[str]
    estimated_score: float
    section_scores: List[SectionEvaluation]
    feedback: ResumeFeedbackReport


class VectorDeleteRequest(BaseModel):
    user_id: str
    resume_id: str


class TailorResumeRequest(BaseModel):
    resume_id: str
    resume_text: str
    target_role: str
    job_description: Optional[str] = None
    existing_skills: List[str] = Field(default_factory=list)


class TailoredBulletItem(BaseModel):
    section: str
    original: str
    tailored: str


class TailoredResumeLLM(BaseModel):
    headline: str
    tailored_summary: str
    highlighted_skills: List[str] = Field(default_factory=list)
    rewritten_bullets: List[TailoredBulletItem] = Field(default_factory=list)
    ats_keywords_added: List[str] = Field(default_factory=list)


class TailorResumeResponse(BaseModel):
    resumeId: str
    targetRole: str
    headline: str
    tailoredSummary: str
    highlightedSkills: List[str]
    rewrittenBullets: List[TailoredBulletItem]
    atsKeywordsAdded: List[str]
