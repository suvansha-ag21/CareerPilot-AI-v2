from typing import List, Optional
from pydantic import BaseModel, Field


class AnalyzeGitHubRepoRequest(BaseModel):
    repo_url: str


class GitHubArchitectureLLM(BaseModel):
    detected_stack: List[str] = Field(min_length=1, max_length=15)
    architecture_highlights: List[str] = Field(min_length=2, max_length=6)
    interview_hooks: List[str] = Field(min_length=2, max_length=6)
    summary: str


class AnalyzeGitHubRepoResponse(BaseModel):
    repoUrl: str
    owner: str
    repoName: str
    description: Optional[str] = None
    defaultBranch: str = "main"
    primaryLanguage: Optional[str] = None
    stars: int = 0
    detectedStack: List[str]
    architectureHighlights: List[str]
    interviewHooks: List[str]
    summary: str


class GenerateDrillsRequest(BaseModel):
    target_role: str = "Full Stack Developer"
    topics: List[str] = Field(default_factory=list)
    count: int = Field(default=6, ge=3, le=15)


class FlashcardDrillItemSchema(BaseModel):
    topic: str
    question: str
    hint: str
    model_answer: str


class FlashcardDrillsLLM(BaseModel):
    drills: List[FlashcardDrillItemSchema] = Field(min_length=1, max_length=15)


class GenerateDrillsResponse(BaseModel):
    drills: List[FlashcardDrillItemSchema]
