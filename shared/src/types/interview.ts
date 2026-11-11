import {
  InterviewCategory,
  InterviewDifficulty,
  InterviewMode,
  InterviewStatus,
} from "../constants/enums";

export interface InterviewCriteriaScoresDTO {
  technicalAccuracy: number;
  depthOfUnderstanding: number;
  completeness: number;
  clarityAndStructure: number;
  practicalExamples: number;
}

export interface InterviewQuestionDTO {
  id: string;
  interviewId: string;
  questionOrder: number;
  question: string;
  topicTag: string;
  userAnswer: string | null;
  modelAnswer: string;
  score: number | null;
  criteriaScores: InterviewCriteriaScoresDTO | null;
  feedback: string | null;
  isFollowUp: boolean;
  createdAt: string;
  answeredAt: string | null;
}

export interface InterviewFeedbackSummaryDTO {
  executiveSummary: string;
  strengths: string[];
  areasToImprove: string[];
  weakTopics: string[];
  rubricAverages: InterviewCriteriaScoresDTO;
  ragTopicsCovered: string[];
  nextRecommendations: string[];
}

export interface InterviewSessionDTO {
  id: string;
  userId: string;
  resumeId: string | null;
  category: InterviewCategory;
  difficulty: InterviewDifficulty;
  mode: InterviewMode;
  durationMinutes: number;
  questionLimit: number;
  targetJobDescription: string | null;
  status: InterviewStatus;
  overallScore: number | null;
  feedbackSummary: InterviewFeedbackSummaryDTO | null;
  answeredCount: number;
  createdAt: string;
  completedAt: string | null;
  questions: InterviewQuestionDTO[];
}
