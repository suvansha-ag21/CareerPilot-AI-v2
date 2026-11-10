export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum SeniorityLevel {
  INTERN = "INTERN",
  JUNIOR = "JUNIOR",
  MID = "MID",
  SENIOR = "SENIOR",
  STAFF = "STAFF",
}

export enum SkillCategory {
  CORE_CS = "CORE_CS",
  FRONTEND = "FRONTEND",
  BACKEND = "BACKEND",
  AI_ML = "AI_ML",
  SYSTEM_DESIGN = "SYSTEM_DESIGN",
  DEVOPS = "DEVOPS",
  BEHAVIORAL = "BEHAVIORAL",
}

export enum SkillPriority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export enum SkillStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  MASTERED = "MASTERED",
}

export enum InterviewMode {
  TEXT = "TEXT",
  VOICE = "VOICE",
}

export enum InterviewType {
  TECHNICAL = "TECHNICAL",
  SYSTEM_DESIGN = "SYSTEM_DESIGN",
  BEHAVIORAL = "BEHAVIORAL",
  RESUME_DEEP_DIVE = "RESUME_DEEP_DIVE",
}

export enum InterviewStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ABANDONED = "ABANDONED",
}

export enum MilestoneStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export enum ApplicationStatus {
  SAVED = "SAVED",
  APPLIED = "APPLIED",
  OA = "OA",
  TECHNICAL_ROUND = "TECHNICAL_ROUND",
  FINAL_ROUND = "FINAL_ROUND",
  OFFER = "OFFER",
  REJECTED = "REJECTED",
}

export enum WorkMode {
  REMOTE = "REMOTE",
  HYBRID = "HYBRID",
  ONSITE = "ONSITE",
}

export const DESIGN_TOKENS = {
  primary: "#6D5DFB",
  secondary: "#8B7CFF",
  background: "#F8FAFC",
  sidebar: "#111827",
  card: "#FFFFFF",
  text: "#172033",
} as const;

export const CAREER_ROLE_PRESETS = [
  "Full Stack Software Engineer",
  "Backend & Distributed Systems Engineer",
  "Frontend Engineer (React / Next.js)",
  "AI / Machine Learning Engineer",
  "Data Scientist",
  "Platform & DevOps Engineer",
] as const;
