from typing import List, Literal, Optional
from pydantic import BaseModel, Field

CategoryStr = Literal[
    "TECHNICAL",
    "HR",
    "DSA",
    "JAVA",
    "PYTHON",
    "SQL",
    "FULL_STACK",
    "PROJECT_BASED",
]
DifficultyStr = Literal["EASY", "MEDIUM", "HARD"]


class CriteriaScoresSchema(BaseModel):
    technicalAccuracy: float = Field(ge=0, le=100)
    depthOfUnderstanding: float = Field(ge=0, le=100)
    completeness: float = Field(ge=0, le=100)
    clarityAndStructure: float = Field(ge=0, le=100)
    practicalExamples: float = Field(ge=0, le=100)


class GeneratedQuestionLLM(BaseModel):
    question: str
    topic_tag: str
    model_answer: str


class EvaluatedAnswerLLM(BaseModel):
    criteria_scores: CriteriaScoresSchema
    feedback: str
    should_follow_up: bool = False
    next_question: Optional[str] = None
    next_topic_tag: Optional[str] = None
    next_model_answer: Optional[str] = None


class InterviewSummaryLLM(BaseModel):
    executive_summary: str
    strengths: List[str] = Field(min_length=1, max_length=5)
    areas_to_improve: List[str] = Field(min_length=1, max_length=5)
    next_recommendations: List[str] = Field(min_length=1, max_length=5)


class StartInterviewQuestionRequest(BaseModel):
    user_id: str
    category: CategoryStr
    difficulty: DifficultyStr
    target_role: str
    years_experience: int = 0
    resume_id: Optional[str] = None
    resume_summary: Optional[str] = None
    projects_summary: Optional[str] = None
    skills_list: List[str] = Field(default_factory=list)
    target_job_description: Optional[str] = None


class StartInterviewQuestionResponse(BaseModel):
    question: str
    topic_tag: str
    model_answer: str


class PreviousQAItem(BaseModel):
    question: str
    topic_tag: str
    user_answer: Optional[str] = None
    score: Optional[float] = None
    is_follow_up: bool = False


class EvaluateAnswerRequest(BaseModel):
    user_id: str
    category: CategoryStr
    difficulty: DifficultyStr
    target_role: str
    current_question: str
    current_topic_tag: str
    current_model_answer: str
    current_is_follow_up: bool = False
    user_answer: str
    remaining_questions: int = Field(ge=0)
    previous_qa: List[PreviousQAItem] = Field(default_factory=list)
    resume_id: Optional[str] = None
    resume_summary: Optional[str] = None
    target_job_description: Optional[str] = None


class NextQuestionPayload(BaseModel):
    question: str
    topic_tag: str
    model_answer: str
    is_follow_up: bool


class EvaluateAnswerResponse(BaseModel):
    score: float
    criteria_scores: CriteriaScoresSchema
    feedback: str
    next_question: Optional[NextQuestionPayload] = None


class AnsweredQuestionMetric(BaseModel):
    question: str
    topic_tag: str
    user_answer: str
    score: float
    criteria_scores: CriteriaScoresSchema
    feedback: str


class SummarizeInterviewRequest(BaseModel):
    category: CategoryStr
    difficulty: DifficultyStr
    target_role: str
    answered_questions: List[AnsweredQuestionMetric]


class SummarizeInterviewResponse(BaseModel):
    overall_score: float
    executive_summary: str
    strengths: List[str]
    areas_to_improve: List[str]
    weak_topics: List[str]
    rubric_averages: CriteriaScoresSchema
    rag_topics_covered: List[str]
    next_recommendations: List[str]


class SpeechMetricsSchema(BaseModel):
    durationSeconds: float
    wordCount: int
    wordsPerMinute: float
    fillerWordCount: int
    fillerWords: List[str] = Field(default_factory=list)
    deliveryFeedback: str


class TranscribeAudioResponse(BaseModel):
    transcript: str
    speech_metrics: SpeechMetricsSchema
