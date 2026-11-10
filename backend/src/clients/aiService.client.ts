import { env } from "../config/env";

export interface AiHealthStatus {
  healthy: boolean;
  service?: string;
  llmProvider?: string;
  embeddingModel?: string;
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
}

export const aiServiceClient = new AiServiceClient();
