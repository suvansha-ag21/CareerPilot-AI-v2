import { ProficiencyLevel, SkillCategory, SkillSource, UserRole } from "../constants/enums";
import { CareerPreferences } from "../schemas/profile.schema";

export interface EducationDTO {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
  grade: string | null;
}

export interface WorkExperienceDTO {
  id: string;
  company: string;
  roleTitle: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  highlights: string[];
}

export interface ProjectDTO {
  id: string;
  title: string;
  techStack: string[];
  description: string;
  repoUrl: string | null;
  liveUrl: string | null;
}

export interface UserSkillDTO {
  id: string;
  skillId: string;
  name: string;
  category: SkillCategory;
  proficiencyLevel: ProficiencyLevel;
  source: SkillSource;
  confidenceScore: number;
}

export interface AuthUserDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage: string | null;
  headline: string | null;
  targetRole: string;
  yearsExperience: number;
  location: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  careerPreferences: CareerPreferences | null;
  educations: EducationDTO[];
  workExperiences: WorkExperienceDTO[];
  projects: ProjectDTO[];
  skills: UserSkillDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponseData {
  accessToken: string;
  user: AuthUserDTO;
}

export interface DashboardAnalyticsDTO {
  readinessScore: number | null;
  latestResumeScore: number | null;
  latestJobMatchScore: number | null;
  totalMockInterviews: number;
  averageInterviewScore: number | null;
  skillsCount: number;
  roadmapProgressPct: number | null;
  applicationStats: {
    total: number;
    active: number;
    interviewsScheduled: number;
    offersReceived: number;
  };
  profileCompletenessPct: number;
  serviceHealth: {
    database: "healthy" | "degraded";
    aiService: "healthy" | "unavailable";
  };
  recentActivities: Array<{
    id: string;
    type: "PROFILE" | "RESUME" | "MATCH" | "INTERVIEW" | "APPLICATION" | "ROADMAP";
    title: string;
    subtitle: string;
    timestamp: string;
  }>;
  upcomingInterviews: Array<{
    id: string;
    company: string;
    jobRole: string;
    interviewDate: string;
  }>;
  recommendations: Array<{
    title: string;
    reason: string;
    actionHref: string;
    actionLabel: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
  }>;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
