export interface RelevantProjectMatchDTO {
  title: string;
  relevanceReason: string;
  matchedTechnologies: string[];
}

export interface MatchRecommendationItemDTO {
  area: string;
  suggestion: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface JobMatchRecommendationsDTO {
  summary: string;
  methodologyNote: string;
  experienceAssessment: string;
  experienceLevelUsed?: string;
  jobTypeUsed?: string;
  requiredSkillsFound: string[];
  preferredSkillsFound: string[];
  items: MatchRecommendationItemDTO[];
}

export interface JobMatchDTO {
  id: string;
  userId: string;
  resumeId: string;
  resumeTitle?: string;
  targetRole: string;
  companyName: string | null;
  jobDescription: string;
  matchScore: number;
  semanticScore: number;
  skillScore: number;
  experienceScore: number;
  matchingSkills: string[];
  partialSkills: string[];
  missingSkills: string[];
  relevantProjects: RelevantProjectMatchDTO[];
  recommendations: JobMatchRecommendationsDTO;
  createdAt: string;
}
