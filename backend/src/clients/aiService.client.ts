import {
  JobMatchRecommendationsDTO,
  ParsedResumeDataDTO,
  RelevantProjectMatchDTO,
  ResumeFeedbackReportDTO,
  ResumeSectionEvaluationDTO,
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
