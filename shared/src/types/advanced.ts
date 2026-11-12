export interface GitHubRepoAnalysisDTO {
  id: string;
  userId: string;
  repoUrl: string;
  owner: string;
  repoName: string;
  description: string | null;
  defaultBranch: string;
  primaryLanguage: string | null;
  stars: number;
  detectedStack: string[];
  architectureHighlights: string[];
  interviewHooks: string[];
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardDrillDTO {
  id: string;
  userId: string;
  topic: string;
  question: string;
  hint: string | null;
  modelAnswer: string;
  source: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  createdAt: string;
}

export interface AiTelemetryLogItemDTO {
  id: string;
  operation: string;
  provider: string;
  model: string;
  latencyMs: number;
  fallbackUsed: boolean;
  success: boolean;
  errorCode: string | null;
  createdAt: string;
}

export interface AiTelemetrySummaryDTO {
  totalCalls: number;
  successRatePct: number;
  avgLatencyMs: number;
  fallbackCount: number;
  byOperation: Array<{
    operation: string;
    calls: number;
    avgLatencyMs: number;
  }>;
  recentLogs: AiTelemetryLogItemDTO[];
}
