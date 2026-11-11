export interface ResumeContactDTO {
  candidateName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
}

export interface ResumeEducationEntryDTO {
  institution: string;
  degree: string;
  field: string | null;
  duration: string | null;
  grade: string | null;
}

export interface ResumeExperienceEntryDTO {
  company: string;
  role: string;
  duration: string | null;
  highlights: string[];
}

export interface ResumeProjectEntryDTO {
  title: string;
  techStack: string[];
  highlights: string[];
}

export interface ParsedResumeDataDTO {
  contact: ResumeContactDTO;
  summary: string | null;
  education: ResumeEducationEntryDTO[];
  experience: ResumeExperienceEntryDTO[];
  projects: ResumeProjectEntryDTO[];
  certifications: string[];
  sectionsDetected: string[];
  wordCount: number;
}

export interface ResumeSectionEvaluationDTO {
  section: string;
  score: number;
  status: "STRONG" | "NEEDS_WORK" | "MISSING";
  summary: string;
  suggestions: string[];
}

export interface ResumeBulletSuggestionDTO {
  original: string;
  improved: string;
  reason: string;
}

export interface ResumeFeedbackReportDTO {
  scoringMethodologyNote: string;
  analysisType?: string;
  targetRoleUsed?: string;
  experienceLevelUsed?: string;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  missingSections: string[];
  unnecessaryInfo: string[];
  formattingSuggestions: string[];
  summarySuggestion: string;
  bulletSuggestions: ResumeBulletSuggestionDTO[];
}

export interface ResumeDTO {
  id: string;
  userId: string;
  title: string;
  fileUrl: string;
  fileType: "PDF" | "DOCX";
  extractedText: string;
  parsedData: ParsedResumeDataDTO;
  skills: string[];
  estimatedScore: number;
  sectionScores: ResumeSectionEvaluationDTO[];
  feedback: ResumeFeedbackReportDTO;
  isPrimary: boolean;
  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
