import {
  ParsedResumeDataDTO,
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
        let detail = "AI service returned an error during resume evaluation";
        try {
          const errBody = (await res.json()) as { detail?: string };
          if (errBody.detail) detail = errBody.detail;
        } catch {
          // ignore non-json error text
        }
        throw new AppError(
          res.status === 503 ? 503 : 502,
          res.status === 503 ? "AI_PROVIDER_UNAVAILABLE" : "AI_PROCESSING_FAILED",
          detail
        );
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
      // Do not block deletion if AI service vector store is temporarily unreachable
    } finally {
      clearTimeout(timer);
    }
  }
}

export const aiServiceClient = new AiServiceClient();
