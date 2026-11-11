from typing import List, Literal, Optional
from pydantic import BaseModel, Field

SkillCategoryStr = Literal[
    "CORE_CS",
    "FRONTEND",
    "BACKEND",
    "DATABASE",
    "AI_ML",
    "DEVOPS",
    "SOFT_SKILL",
]
ProficiencyStr = Literal["BEGINNER", "INTERMEDIATE", "ADVANCED"]
SkillImportanceStr = Literal["CRITICAL", "IMPORTANT", "NICE_TO_HAVE"]
BenchmarkStatusStr = Literal["MASTERED", "NEEDS_LEVEL_UP", "MISSING"]
TaskPriorityStr = Literal["HIGH", "MEDIUM", "LOW"]


class CandidateSkillInput(BaseModel):
    name: str
    normalizedName: str
    category: SkillCategoryStr = "CORE_CS"
    proficiencyLevel: ProficiencyStr = "INTERMEDIATE"
    confidenceScore: int = 60
    source: str = "PROFILE"


class LearningResourceSchema(BaseModel):
    title: str
    type: Literal["DOC", "COURSE", "PRACTICE", "PROJECT"]
    url: str
    estimatedHours: int = Field(ge=1, le=40)


class SkillRequirementBenchmarkSchema(BaseModel):
    skill: str
    category: SkillCategoryStr
    importance: SkillImportanceStr
    requiredLevel: ProficiencyStr
    currentLevel: Optional[ProficiencyStr] = None
    confidenceScore: int = Field(ge=0, le=100)
    status: BenchmarkStatusStr
    source: Optional[str] = None
    prerequisites: List[str] = Field(default_factory=list)
    recommendedAction: str
    resources: List[LearningResourceSchema] = Field(default_factory=list)


class SkillCategoryCoverageSchema(BaseModel):
    category: SkillCategoryStr
    label: str
    covered: int
    total: int
    coveragePct: float


class AnalyzeSkillGapRequest(BaseModel):
    target_role: str
    learning_preference: str = "BEGINNER_TO_ADVANCED"
    current_skills: List[CandidateSkillInput] = Field(default_factory=list)
    resume_skills: List[str] = Field(default_factory=list)
    resume_summary: Optional[str] = None
    job_match_role: Optional[str] = None
    job_match_missing_skills: List[str] = Field(default_factory=list)
    job_match_partial_skills: List[str] = Field(default_factory=list)


class SkillActionHint(BaseModel):
    skill: str
    recommended_action: str


class SkillGapLLMEnrichment(BaseModel):
    ai_summary: str
    quick_wins: List[str] = Field(default_factory=list, max_length=5)
    skill_actions: List[SkillActionHint] = Field(default_factory=list)


class AnalyzeSkillGapResponse(BaseModel):
    target_role: str
    readiness_pct: float
    total_required: int
    mastered_count: int
    needs_level_up_count: int
    missing_count: int
    benchmarks: List[SkillRequirementBenchmarkSchema]
    missing_skills: List[SkillRequirementBenchmarkSchema]
    learning_order: List[str]
    category_breakdown: List[SkillCategoryCoverageSchema]
    ai_summary: str
    quick_wins: List[str]


class GenerateRoadmapRequest(BaseModel):
    target_role: str
    skill_level: str = "BEGINNER"
    daily_study_hours: int = Field(default=2, ge=1, le=12)
    duration_days: int = Field(default=30, ge=14, le=180)
    estimated_weeks: int = Field(default=4, ge=2, le=26)
    hours_per_week: int = Field(default=14, ge=3, le=60)
    learning_preference: str = "MIXED_LEARNING"
    skill_gaps: List[SkillRequirementBenchmarkSchema] = Field(default_factory=list)
    learning_order: List[str] = Field(default_factory=list)
    current_skill_names: List[str] = Field(default_factory=list)
    resume_summary: Optional[str] = None


class RoadmapTaskLLMSchema(BaseModel):
    weekNumber: int = Field(ge=1, le=26)
    dayNumber: int = Field(ge=1, le=5)
    title: str
    description: str
    skillTag: str
    priority: TaskPriorityStr = "MEDIUM"


class RoadmapLLMStructure(BaseModel):
    roadmap_title: str
    tasks: List[RoadmapTaskLLMSchema] = Field(min_length=4, max_length=32)


class GeneratedRoadmapTaskItem(BaseModel):
    weekNumber: int
    dayNumber: int
    title: str
    description: str
    skillTag: str
    priority: TaskPriorityStr
    resources: List[LearningResourceSchema] = Field(default_factory=list)
    dueDateOffsetDays: int


class GenerateRoadmapResponse(BaseModel):
    title: str
    estimated_weeks: int
    tasks: List[GeneratedRoadmapTaskItem]
