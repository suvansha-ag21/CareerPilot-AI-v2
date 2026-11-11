import {
  CurrentCandidateSkillDTO,
  InterviewCategory,
  InterviewCriteriaScoresDTO,
  InterviewDifficulty,
  InterviewFeedbackSummaryDTO,
  JobMatchRecommendationsDTO,
  LearningResourceDTO,
  ParsedResumeDataDTO,
  RelevantProjectMatchDTO,
  ResumeFeedbackReportDTO,
  ResumeSectionEvaluationDTO,
  SkillCategoryCoverageDTO,
  SkillRequirementBenchmarkDTO,
  SpeechMetricsDTO,
  TaskPriority,
} from "@careerpilot/shared";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

export interface AiHealthStatus {
  healthy: boolean;
  service?: string;
  llmProvider?: string;
  embeddingModel?: string;
}

export interface AiResumeAnalyzeResponse {
  extractedText: string;
  parsedData: ParsedResumeDataDTO;
  skills: string[];
  estimatedScore: number;
  sectionScores: ResumeSectionEvaluationDTO[];
  feedback: ResumeFeedbackReportDTO;
}

export interface AiSkillGapResponse {
  targetRole: string;
  readinessPct: number;
  totalRequired: number;
  masteredCount: number;
  needsLevelUpCount: number;
  missingCount: number;
  benchmarks: SkillRequirementBenchmarkDTO[];
  missingSkills: SkillRequirementBenchmarkDTO[];
  learningOrder: string[];
  categoryBreakdown: SkillCategoryCoverageDTO[];
  aiSummary: string;
  quickWins: string[];
}

export interface AiRoadmapTaskResponseItem {
  weekNumber: number;
  dayNumber: number;
  title: string;
  description: string;
  skillTag: string;
  priority: TaskPriority;
  resources: LearningResourceDTO[];
  dueDateOffsetDays: number;
}

export interface AiInterviewQuestionGenerated {
  question: string;
  topicTag: string;
  modelAnswer: string;
}

export interface AiEvaluateAnswerResponse {
  score: number;
  criteriaScores: InterviewCriteriaScoresDTO;
  feedback: string;
  nextQuestion: {
    question: string;
    topicTag: string;
    modelAnswer: string;
    isFollowUp: boolean;
  } | null;
}

export interface AiSummarizeInterviewResponse {
  overallScore: number;
  feedbackSummary: InterviewFeedbackSummaryDTO;
}

export interface AiTranscribeAudioResponse {
  transcript: string;
  speechMetrics: SpeechMetricsDTO;
}

export interface AiGenerateRoadmapResponse {
  title: string;
  estimatedWeeks: number;
  tasks: AiRoadmapTaskResponseItem[];
}

export interface AiJobMatchResponse {
  targetRole: string;
  companyName: string | null;
  jobDescriptionText: string;
  matchScore: number;
  semanticScore: number;
  skillScore: number;
  experienceScore: number;
  matchingSkills: string[];
  partialSkills: string[];
  missingSkills: string[];
  relevantProjects: RelevantProjectMatchDTO[];
  recommendations: JobMatchRecommendationsDTO;
}

class AiServiceClient {
  private readonly baseUrl = env.AI_SERVICE_URL.replace(/\/$/, "");

  async checkHealth(): Promise<AiHealthStatus> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    try {
      const res = await fetch(`${this.baseUrl}/internal/ai/health`, {
        method: "GET",
        headers: {
          "X-Internal-Service-Key": env.INTERNAL_SERVICE_KEY,
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        return { healthy: false };
      }

      const data = (await res.json()) as {
        status?: string;
        service?: string;
        llm_provider?: string;
        embedding_model?: string;
      };

      return {
        healthy: data.status === "ok",
        service: data.service,
        llmProvider: data.llm_provider,
        embeddingModel: data.embedding_model,
      };
    } catch {
      return { healthy: false };
    } finally {
      clearTimeout(timer);
    }
  }

  private async handleErrorResponse(res: Response, defaultMsg: string): Promise<never> {
    let detail = defaultMsg;
    try {
      const errBody = (await res.json()) as { detail?: string };
      if (errBody.detail) detail = errBody.detail;
    } catch {
      // ignore non-json error text
    }
    const statusCode = res.status === 400 ? 400 : res.status === 503 ? 503 : 502;
    const code =
      res.status === 400
        ? "BAD_REQUEST"
        : res.status === 503
        ? "AI_PROVIDER_UNAVAILABLE"
        : "AI_PROCESSING_FAILED";
    throw new AppError(statusCode, code, detail);
  }

  async parseAndEvaluateResume(params: {
    userId: string;
    resumeId: string;
    targetRole: string;
    filename: string;
    fileType: "PDF" | "DOCX";
    fileBuffer: Buffer;
  }): Promise<AiResumeAnalyzeResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);

    try {
      const form = new FormData();
      const mimeType =
        params.fileType === "PDF"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      const blob = new Blob([new Uint8Array(params.fileBuffer)], { type: mimeType });

      form.append("file", blob, params.filename);
      form.append("user_id", params.userId);
      form.append("resume_id", params.resumeId);
      form.append("target_role", params.targetRole);
      form.append("file_type", params.fileType);

      const res = await fetch(`${this.baseUrl}/internal/ai/resumes/parse-and-evaluate`, {
        method: "POST",
        headers: {
          "X-Internal-Service-Key": env.INTERNAL_SERVICE_KEY,
        },
        body: form,
        signal: controller.signal,
      });

      if (!res.ok) {
        await this.handleErrorResponse(res, "AI service returned an error during resume evaluation");
      }

      const raw = (await res.json()) as {
        extracted_text: string;
        parsed_data: ParsedResumeDataDTO;
        skills: string[];
        estimated_score: number;
        section_scores: ResumeSectionEvaluationDTO[];
        feedback: ResumeFeedbackReportDTO;
      };

      return {
        extractedText: raw.extracted_text,
        parsedData: raw.parsed_data,
        skills: raw.skills,
        estimatedScore: raw.estimated_score,
        sectionScores: raw.section_scores,
        feedback: raw.feedback,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        503,
        "AI_SERVICE_UNREACHABLE",
        "Python AI microservice is unreachable or timed out while analyzing your resume."
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async evaluateJobMatch(params: {
    userId: string;
    resumeId: string;
    resumeText: string;
    resumeSkills: string[];
    candidateYears: number;
    jobDescription?: string;
    targetRole?: string;
    companyName?: string;
    jdFile?: { buffer: Buffer; filename: string; mime: string };
  }): Promise<AiJobMatchResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);

    try {
      const form = new FormData();
      form.append("user_id", params.userId);
      form.append("resume_id", params.resumeId);
      form.append("resume_text", params.resumeText);
      form.append("resume_skills_json", JSON.stringify(params.resumeSkills));
      form.append("candidate_years", String(params.candidateYears));

      if (params.jobDescription) form.append("job_description", params.jobDescription);
      if (params.targetRole) form.append("target_role", params.targetRole);
      if (params.companyName) form.append("company_name", params.companyName);
      if (params.jdFile) {
        const blob = new Blob([new Uint8Array(params.jdFile.buffer)], {
          type: params.jdFile.mime,
        });
        form.append("jd_file", blob, params.jdFile.filename);
      }

      const res = await fetch(`${this.baseUrl}/internal/ai/matches/evaluate`, {
        method: "POST",
        headers: {
          "X-Internal-Service-Key": env.INTERNAL_SERVICE_KEY,
        },
        body: form,
        signal: controller.signal,
      });

      if (!res.ok) {
        await this.handleErrorResponse(res, "AI service failed during JD compatibility evaluation");
      }

      const raw = (await res.json()) as {
        target_role: string;
        company_name: string | null;
        job_description_text: string;
        match_score: number;
        semantic_score: number;
        skill_score: number;
        experience_score: number;
        matching_skills: string[];
        partial_skills: string[];
        missing_skills: string[];
        relevant_projects: RelevantProjectMatchDTO[];
        recommendations: JobMatchRecommendationsDTO;
      };

      return {
        targetRole: raw.target_role,
        companyName: raw.company_name,
        jobDescriptionText: raw.job_description_text,
        matchScore: raw.match_score,
        semanticScore: raw.semantic_score,
        skillScore: raw.skill_score,
        experienceScore: raw.experience_score,
        matchingSkills: raw.matching_skills,
        partialSkills: raw.partial_skills,
        missingSkills: raw.missing_skills,
        relevantProjects: raw.relevant_projects,
        recommendations: raw.recommendations,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        503,
        "AI_SERVICE_UNREACHABLE",
        "Python AI microservice is unreachable or timed out while running JD match."
      );
    } finally {
      clearTimeout(timer);
    }
  }

  private async postJsonInternal<T>(
    path: string,
    payload: unknown,
    defaultErrorMsg: string,
    timeoutMessage: string
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Service-Key": env.INTERNAL_SERVICE_KEY,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        await this.handleErrorResponse(res, defaultErrorMsg);
      }

      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(503, "AI_SERVICE_UNREACHABLE", timeoutMessage);
    } finally {
      clearTimeout(timer);
    }
  }

  async analyzeSkillGap(params: {
    targetRole: string;
    currentSkills: CurrentCandidateSkillDTO[];
    resumeSkills: string[];
    resumeSummary?: string | null;
    jobMatchRole?: string | null;
    jobMatchMissingSkills?: string[];
    jobMatchPartialSkills?: string[];
  }): Promise<AiSkillGapResponse> {
    const raw = await this.postJsonInternal<{
      target_role: string;
      readiness_pct: number;
      total_required: number;
      mastered_count: number;
      needs_level_up_count: number;
      missing_count: number;
      benchmarks: SkillRequirementBenchmarkDTO[];
      missing_skills: SkillRequirementBenchmarkDTO[];
      learning_order: string[];
      category_breakdown: SkillCategoryCoverageDTO[];
      ai_summary: string;
      quick_wins: string[];
    }>(
      "/internal/ai/skills/analyze-gap",
      {
        target_role: params.targetRole,
        current_skills: params.currentSkills.map((s) => ({
          name: s.name,
          normalizedName: s.normalizedName,
          category: s.category,
          proficiencyLevel: s.proficiencyLevel,
          confidenceScore: s.confidenceScore,
          source: s.source,
        })),
        resume_skills: params.resumeSkills,
        resume_summary: params.resumeSummary ?? null,
        job_match_role: params.jobMatchRole ?? null,
        job_match_missing_skills: params.jobMatchMissingSkills ?? [],
        job_match_partial_skills: params.jobMatchPartialSkills ?? [],
      },
      "AI service failed during skill gap evaluation",
      "Python AI microservice is unreachable or timed out while analyzing skill gaps."
    );

    return {
      targetRole: raw.target_role,
      readinessPct: raw.readiness_pct,
      totalRequired: raw.total_required,
      masteredCount: raw.mastered_count,
      needsLevelUpCount: raw.needs_level_up_count,
      missingCount: raw.missing_count,
      benchmarks: raw.benchmarks,
      missingSkills: raw.missing_skills,
      learningOrder: raw.learning_order,
      categoryBreakdown: raw.category_breakdown,
      aiSummary: raw.ai_summary,
      quickWins: raw.quick_wins,
    };
  }

  async generateRoadmap(params: {
    targetRole: string;
    estimatedWeeks: number;
    hoursPerWeek: number;
    skillGaps: SkillRequirementBenchmarkDTO[];
    learningOrder: string[];
    currentSkillNames: string[];
    resumeSummary?: string | null;
  }): Promise<AiGenerateRoadmapResponse> {
    const raw = await this.postJsonInternal<{
      title: string;
      estimated_weeks: number;
      tasks: AiRoadmapTaskResponseItem[];
    }>(
      "/internal/ai/roadmap/generate",
      {
        target_role: params.targetRole,
        estimated_weeks: params.estimatedWeeks,
        hours_per_week: params.hoursPerWeek,
        skill_gaps: params.skillGaps,
        learning_order: params.learningOrder,
        current_skill_names: params.currentSkillNames,
        resume_summary: params.resumeSummary ?? null,
      },
      "AI service failed during personalized roadmap generation",
      "Python AI microservice is unreachable or timed out while generating roadmap."
    );

    return {
      title: raw.title,
      estimatedWeeks: raw.estimated_weeks,
      tasks: raw.tasks,
    };
  }

  async startInterviewQuestion(params: {
    userId: string;
    category: InterviewCategory;
    difficulty: InterviewDifficulty;
    targetRole: string;
    yearsExperience: number;
    resumeId?: string | null;
    resumeSummary?: string | null;
    projectsSummary?: string | null;
    skillsList: string[];
    targetJobDescription?: string | null;
  }): Promise<AiInterviewQuestionGenerated> {
    const raw = await this.postJsonInternal<{
      question: string;
      topic_tag: string;
      model_answer: string;
    }>(
      "/internal/ai/interviews/start-question",
      {
        user_id: params.userId,
        category: params.category,
        difficulty: params.difficulty,
        target_role: params.targetRole,
        years_experience: params.yearsExperience,
        resume_id: params.resumeId ?? null,
        resume_summary: params.resumeSummary ?? null,
        projects_summary: params.projectsSummary ?? null,
        skills_list: params.skillsList,
        target_job_description: params.targetJobDescription ?? null,
      },
      "AI service failed while generating opening interview question",
      "Python AI microservice timed out while preparing mock interview question."
    );

    return {
      question: raw.question,
      topicTag: raw.topic_tag,
      modelAnswer: raw.model_answer,
    };
  }

  async evaluateAnswerAndNext(params: {
    userId: string;
    category: InterviewCategory;
    difficulty: InterviewDifficulty;
    targetRole: string;
    currentQuestion: string;
    currentTopicTag: string;
    currentModelAnswer: string;
    currentIsFollowUp: boolean;
    userAnswer: string;
    remainingQuestions: number;
    previousQa: Array<{
      question: string;
      topicTag: string;
      userAnswer: string | null;
      score: number | null;
      isFollowUp: boolean;
    }>;
    resumeId?: string | null;
    resumeSummary?: string | null;
    targetJobDescription?: string | null;
  }): Promise<AiEvaluateAnswerResponse> {
    const raw = await this.postJsonInternal<{
      score: number;
      criteria_scores: InterviewCriteriaScoresDTO;
      feedback: string;
      next_question: {
        question: string;
        topic_tag: string;
        model_answer: string;
        is_follow_up: boolean;
      } | null;
    }>(
      "/internal/ai/interviews/evaluate-and-next",
      {
        user_id: params.userId,
        category: params.category,
        difficulty: params.difficulty,
        target_role: params.targetRole,
        current_question: params.currentQuestion,
        current_topic_tag: params.currentTopicTag,
        current_model_answer: params.currentModelAnswer,
        current_is_follow_up: params.currentIsFollowUp,
        user_answer: params.userAnswer,
        remaining_questions: params.remainingQuestions,
        previous_qa: params.previousQa.map((q) => ({
          question: q.question,
          topic_tag: q.topicTag,
          user_answer: q.userAnswer,
          score: q.score,
          is_follow_up: q.isFollowUp,
        })),
        resume_id: params.resumeId ?? null,
        resume_summary: params.resumeSummary ?? null,
        target_job_description: params.targetJobDescription ?? null,
      },
      "AI service failed while grading mock interview response",
      "Python AI microservice timed out while evaluating your interview answer."
    );

    return {
      score: raw.score,
      criteriaScores: raw.criteria_scores,
      feedback: raw.feedback,
      nextQuestion: raw.next_question
        ? {
            question: raw.next_question.question,
            topicTag: raw.next_question.topic_tag,
            modelAnswer: raw.next_question.model_answer,
            isFollowUp: raw.next_question.is_follow_up,
          }
        : null,
    };
  }

  async summarizeInterview(params: {
    category: InterviewCategory;
    difficulty: InterviewDifficulty;
    targetRole: string;
    answeredQuestions: Array<{
      question: string;
      topicTag: string;
      userAnswer: string;
      score: number;
      criteriaScores: InterviewCriteriaScoresDTO;
      feedback: string;
    }>;
  }): Promise<AiSummarizeInterviewResponse> {
    const raw = await this.postJsonInternal<{
      overall_score: number;
      executive_summary: string;
      strengths: string[];
      areas_to_improve: string[];
      weak_topics: string[];
      rubric_averages: InterviewCriteriaScoresDTO;
      rag_topics_covered: string[];
      next_recommendations: string[];
    }>(
      "/internal/ai/interviews/summarize",
      {
        category: params.category,
        difficulty: params.difficulty,
        target_role: params.targetRole,
        answered_questions: params.answeredQuestions.map((q) => ({
          question: q.question,
          topic_tag: q.topicTag,
          user_answer: q.userAnswer,
          score: q.score,
          criteria_scores: q.criteriaScores,
          feedback: q.feedback,
        })),
      },
      "AI service failed while generating interview summary report",
      "Python AI microservice timed out while compiling final interview report."
    );

    return {
      overallScore: raw.overall_score,
      feedbackSummary: {
        executiveSummary: raw.executive_summary,
        strengths: raw.strengths,
        areasToImprove: raw.areas_to_improve,
        weakTopics: raw.weak_topics,
        rubricAverages: raw.rubric_averages,
        ragTopicsCovered: raw.rag_topics_covered,
        nextRecommendations: raw.next_recommendations,
      },
    };
  }

  async transcribeInterviewAudio(params: {
    audioBuffer: Buffer;
    filename: string;
    mimeType: string;
    durationSeconds: number;
  }): Promise<AiTranscribeAudioResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);

    try {
      const form = new FormData();
      const blob = new Blob([new Uint8Array(params.audioBuffer)], { type: params.mimeType });
      form.append("audio", blob, params.filename);
      form.append("mime_type", params.mimeType);
      form.append("duration_seconds", String(params.durationSeconds));

      const res = await fetch(`${this.baseUrl}/internal/ai/interviews/transcribe-audio`, {
        method: "POST",
        headers: {
          "X-Internal-Service-Key": env.INTERNAL_SERVICE_KEY,
        },
        body: form,
        signal: controller.signal,
      });

      if (!res.ok) {
        await this.handleErrorResponse(res, "AI service failed during speech transcription");
      }

      const raw = (await res.json()) as {
        transcript: string;
        speech_metrics: SpeechMetricsDTO;
      };

      return {
        transcript: raw.transcript,
        speechMetrics: raw.speech_metrics,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        503,
        "AI_SERVICE_UNREACHABLE",
        "Python AI microservice timed out during speech transcription."
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async deleteResumeVectors(userId: string, resumeId: string): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      await fetch(`${this.baseUrl}/internal/ai/resumes/vectors/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Service-Key": env.INTERNAL_SERVICE_KEY,
        },
        body: JSON.stringify({ user_id: userId, resume_id: resumeId }),
        signal: controller.signal,
      });
    } catch {
      // ignore cleanup failures
    } finally {
      clearTimeout(timer);
    }
  }
}

export const aiServiceClient = new AiServiceClient();
