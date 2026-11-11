import {
  ProficiencyLevel,
  SkillCategory,
  SkillSource,
  TaskPriority,
  TaskStatus,
} from "../constants/enums";

export type SkillImportance = "CRITICAL" | "IMPORTANT" | "NICE_TO_HAVE";
export type SkillBenchmarkStatus = "MASTERED" | "NEEDS_LEVEL_UP" | "MISSING";

export interface LearningResourceDTO {
  title: string;
  type: "DOC" | "COURSE" | "PRACTICE" | "PROJECT";
  url: string;
  estimatedHours: number;
}

export interface SkillRequirementBenchmarkDTO {
  skill: string;
  category: SkillCategory;
  importance: SkillImportance;
  requiredLevel: ProficiencyLevel;
  currentLevel: ProficiencyLevel | null;
  confidenceScore: number;
  status: SkillBenchmarkStatus;
  source: SkillSource | null;
  prerequisites: string[];
  recommendedAction: string;
  resources: LearningResourceDTO[];
}

export interface SkillCategoryCoverageDTO {
  category: SkillCategory;
  label: string;
  covered: number;
  total: number;
  coveragePct: number;
}

export interface CurrentCandidateSkillDTO {
  id: string;
  skillId: string;
  name: string;
  normalizedName: string;
  category: SkillCategory;
  proficiencyLevel: ProficiencyLevel;
  source: SkillSource;
  confidenceScore: number;
}

export interface SkillGapReportDTO {
  targetRole: string;
  readinessPct: number;
  totalRequired: number;
  masteredCount: number;
  needsLevelUpCount: number;
  missingCount: number;
  currentSkills: CurrentCandidateSkillDTO[];
  benchmarks: SkillRequirementBenchmarkDTO[];
  missingSkills: SkillRequirementBenchmarkDTO[];
  learningOrder: string[];
  categoryBreakdown: SkillCategoryCoverageDTO[];
  aiSummary: string;
  quickWins: string[];
  evaluatedFrom: {
    resumeTitle: string | null;
    jobMatchRole: string | null;
    profileSkillsCount: number;
  };
}

export interface RoadmapTaskDTO {
  id: string;
  roadmapId: string;
  weekNumber: number;
  dayNumber: number;
  title: string;
  description: string;
  skillTag: string;
  priority: TaskPriority;
  resources: LearningResourceDTO[];
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
}

export interface LearningRoadmapDTO {
  id: string;
  userId: string;
  targetRole: string;
  title: string;
  estimatedWeeks: number;
  progressPct: number;
  isActive: boolean;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  createdAt: string;
  updatedAt: string;
  tasks: RoadmapTaskDTO[];
}
