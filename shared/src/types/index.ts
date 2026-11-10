import { UserRole } from "../constants/enums";

export interface UserProfileDTO {
  id: string;
  userId: string;
  fullName: string;
  headline: string | null;
  targetRole: string;
  yearsExperience: number;
  preferredStack: string[];
  location: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  avatarUrl: string | null;
  updatedAt: string;
}

export interface AuthUserDTO {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  profile: UserProfileDTO;
}

export interface AuthResponseData {
  accessToken: string;
  user: AuthUserDTO;
}

export interface DashboardOverviewDTO {
  readinessScore: number | null;
  averageAtsScore: number | null;
  resumesCount: number;
  matchesCount: number;
  openSkillGapsCount: number;
  completedInterviewsCount: number;
  activeApplicationsCount: number;
  roadmapProgressPct: number | null;
  profileCompletenessPct: number;
  serviceHealth: {
    database: "healthy" | "degraded";
    aiService: "healthy" | "unavailable";
  };
  recentActivity: Array<{
    id: string;
    type: "PROFILE" | "RESUME" | "MATCH" | "INTERVIEW" | "APPLICATION" | "ROADMAP";
    title: string;
    subtitle: string;
    timestamp: string;
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
