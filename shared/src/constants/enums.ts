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

export enum ResumeFileType {
  PDF = "PDF",
  DOCX = "DOCX",
}

export enum ResumeAnalysisType {
  COMPLETE_ANALYSIS = "COMPLETE_ANALYSIS",
  ATS_COMPATIBILITY = "ATS_COMPATIBILITY",
  TECHNICAL_SKILLS = "TECHNICAL_SKILLS",
  PROJECT_EVALUATION = "PROJECT_EVALUATION",
}

export enum JobType {
  INTERNSHIP = "INTERNSHIP",
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  REMOTE = "REMOTE",
  ON_SITE = "ON_SITE",
  HYBRID = "HYBRID",
}

export enum SkillGapLearningPreference {
  BEGINNER_TO_ADVANCED = "BEGINNER_TO_ADVANCED",
  INTERMEDIATE_TO_ADVANCED = "INTERMEDIATE_TO_ADVANCED",
  INTERVIEW_PREPARATION = "INTERVIEW_PREPARATION",
  PROJECT_BASED_LEARNING = "PROJECT_BASED_LEARNING",
}

export enum RoadmapLearningPreference {
  MIXED_LEARNING = "MIXED_LEARNING",
  VIDEO_BASED = "VIDEO_BASED",
  DOCUMENTATION = "DOCUMENTATION",
  HANDS_ON_PROJECTS = "HANDS_ON_PROJECTS",
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
  BEHAVIORAL = "BEHAVIORAL",
  MIXED = "MIXED",
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
  SHORTLISTED = "SHORTLISTED",
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

export const USER_PERSONA_OPTIONS = [
  "College Student",
  "Recent Graduate",
  "Working Professional",
  "Career Switcher",
] as const;

export const EDUCATION_LEVEL_OPTIONS = [
  "Diploma",
  "Undergraduate (B.Tech, BCA, B.Sc, etc.)",
  "Postgraduate (M.Tech, MCA, MBA, etc.)",
  "Other",
] as const;

export const CAREER_ROLE_PRESETS = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "AI/ML Engineer",
  "Data Scientist",
  "Data Analyst",
  "Software Engineer (SDE)",
  "DevOps Engineer",
  "Cybersecurity Engineer",
] as const;

export const SKILL_GAP_ROLE_OPTIONS = [
  "Software Engineer (SDE)",
  "Full Stack Developer",
  "AI/ML Engineer",
  "Data Scientist",
  "Backend Developer",
  "Frontend Developer",
] as const;

export const EXPERIENCE_LEVEL_OPTIONS = [
  "Beginner",
  "Fresher",
  "0–1 years",
  "1–3 years",
  "3+ years",
] as const;

export const CAREER_GOAL_OPTIONS = [
  "Get an internship",
  "Prepare for campus placements",
  "Become a Full Stack Developer",
  "Become an AI Engineer",
  "Improve my resume",
  "Prepare for technical interviews",
  "Switch to a new career",
] as const;

export const TECHNICAL_SUBCATEGORY_OPTIONS = [
  "DSA",
  "OOP",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "SQL",
  "Java",
  "Python",
  "JavaScript",
  "React",
  "Node.js",
  "System Design",
] as const;

export const ROADMAP_DURATION_DAYS_OPTIONS = [30, 60, 90, 180] as const;

export const ROADMAP_DAILY_HOURS_OPTIONS = [
  { value: 1, label: "1 hour / day" },
  { value: 2, label: "2 hours / day" },
  { value: 3, label: "3 hours / day" },
  { value: 4, label: "4+ hours / day" },
] as const;
