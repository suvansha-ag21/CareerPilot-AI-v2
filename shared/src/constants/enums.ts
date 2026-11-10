export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum SkillCategory {
  CORE_CS = "CORE_CS",
  FRONTEND = "FRONTEND",
  BACKEND = "BACKEND",
  DATABASE = "DATABASE",
  AI_ML = "AI_ML",
  DEVOPS = "DEVOPS",
  SOFT_SKILL = "SOFT_SKILL",
}

export enum ProficiencyLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
}

export enum SkillSource {
  PROFILE = "PROFILE",
  RESUME_PARSED = "RESUME_PARSED",
  INTERVIEW_EVAL = "INTERVIEW_EVAL",
}

export enum InterviewCategory {
  TECHNICAL = "TECHNICAL",
  HR = "HR",
  DSA = "DSA",
  JAVA = "JAVA",
  PYTHON = "PYTHON",
  SQL = "SQL",
  FULL_STACK = "FULL_STACK",
  PROJECT_BASED = "PROJECT_BASED",
}

export enum InterviewDifficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

export enum InterviewMode {
  TEXT = "TEXT",
  VOICE = "VOICE",
}

export enum InterviewStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ABANDONED = "ABANDONED",
}

export enum TaskPriority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export enum ApplicationStatus {
  APPLIED = "APPLIED",
  ASSESSMENT = "ASSESSMENT",
  INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED",
  SELECTED = "SELECTED",
  REJECTED = "REJECTED",
  OFFER_RECEIVED = "OFFER_RECEIVED",
}

export const DESIGN_TOKENS = {
  primary: "#6D5DFB",
  secondary: "#8B7CFF",
  background: "#F8FAFC",
  sidebar: "#111827",
  card: "#FFFFFF",
  primaryText: "#172033",
  secondaryText: "#64748B",
  border: "#E2E8F0",
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#EF4444",
} as const;

export const CAREER_ROLE_PRESETS = [
  "Full Stack Developer",
  "Software Engineer Intern",
  "Backend Software Engineer",
  "Frontend Developer",
  "Data Scientist & ML Engineer",
  "Java Spring Boot Developer",
  "Python Backend Developer",
] as const;
