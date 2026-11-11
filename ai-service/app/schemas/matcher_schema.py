from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class RelevantProjectMatch(BaseModel):
    title: str
    relevanceReason: str
    matchedTechnologies: List[str] = Field(default_factory=list)


class MatchRecommendationItem(BaseModel):
    area: str
    suggestion: str
    priority: Literal["HIGH", "MEDIUM", "LOW"]


class JobMatchLLMOutput(BaseModel):
    inferred_target_role: str = ""
    inferred_company_name: Optional[str] = None
    required_experience_years: float = 0.0
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    matching_skills_extra: List[str] = Field(default_factory=list)
    partial_skills_extra: List[str] = Field(default_factory=list)
    missing_skills_extra: List[str] = Field(default_factory=list)
    relevant_projects: List[RelevantProjectMatch] = Field(default_factory=list)
    experience_assessment: str = ""
    executive_summary: str = ""
    recommendations: List[MatchRecommendationItem] = Field(default_factory=list)


class JobMatchRecommendationsPayload(BaseModel):
    summary: str
    methodologyNote: str
    experienceAssessment: str
    requiredSkillsFound: List[str] = Field(default_factory=list)
    preferredSkillsFound: List[str] = Field(default_factory=list)
    items: List[MatchRecommendationItem] = Field(default_factory=list)


class JobMatchEvaluateResponse(BaseModel):
    target_role: str
    company_name: Optional[str] = None
    job_description_text: str
    match_score: float
    semantic_score: float
    skill_score: float
    experience_score: float
    matching_skills: List[str] = Field(default_factory=list)
    partial_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    relevant_projects: List[RelevantProjectMatch] = Field(default_factory=list)
    recommendations: JobMatchRecommendationsPayload
