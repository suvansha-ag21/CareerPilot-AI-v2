import { ApplicationStatus, InterviewCategory, InterviewMode } from "../constants/enums";
import { DashboardAnalyticsDTO } from "./index";

export interface JobApplicationDTO {
  id: string;
  userId: string;
  company: string;
  jobRole: string;
  jobDescription: string | null;
  applicationDate: string;
  status: ApplicationStatus;
  interviewDate: string | null;
  applicationUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DetailedAnalyticsDTO {
  overview: DashboardAnalyticsDTO;
  interviewTrend: Array<{
    id: string;
    date: string;
    category: InterviewCategory;
    mode: InterviewMode;
    score: number;
  }>;
  resumeTrend: Array<{
    id: string;
    title: string;
    date: string;
    score: number;
  }>;
  jobMatchTrend: Array<{
    id: string;
    role: string;
    company: string | null;
    date: string;
    matchScore: number;
    semanticScore: number;
    skillScore: number;
  }>;
  applicationFunnel: Array<{
    status: ApplicationStatus;
    label: string;
    count: number;
  }>;
  conversionMetrics: {
    totalApps: number;
    interviewRatePct: number;
    offerRatePct: number;
  };
  skillCategoryStats: Array<{
    category: string;
    label: string;
    count: number;
    avgConfidence: number;
  }>;
  recurringWeakTopics: Array<{
    topic: string;
    count: number;
  }>;
  missingSkillHotspots: string[];
  roadmapStats: {
    totalRoadmaps: number;
    activeTitle: string | null;
    activeProgressPct: number | null;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
  };
}
