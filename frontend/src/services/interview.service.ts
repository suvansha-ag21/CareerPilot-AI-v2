import {
  InterviewSessionDTO,
  SpeechMetricsDTO,
  StartInterviewInput,
  SubmitInterviewAnswerInput,
} from "@careerpilot/shared";
import { apiRequest, getAccessToken } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const interviewApi = {
  list: () => apiRequest<InterviewSessionDTO[]>("/interviews"),

  getById: (id: string) => apiRequest<InterviewSessionDTO>(`/interviews/${id}`),

  start: (input: StartInterviewInput) =>
    apiRequest<InterviewSessionDTO>("/interviews/start", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  submitAnswer: (interviewId: string, input: SubmitInterviewAnswerInput) =>
    apiRequest<InterviewSessionDTO>(`/interviews/${interviewId}/answer`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  transcribeAudio: (interviewId: string, audioBlob: Blob, durationSeconds: number) => {
    const form = new FormData();
    const ext = audioBlob.type.includes("wav")
      ? ".wav"
      : audioBlob.type.includes("mp4")
      ? ".mp4"
      : audioBlob.type.includes("ogg")
      ? ".ogg"
      : ".webm";
    form.append("audio", audioBlob, `recording${ext}`);
    form.append("durationSeconds", String(durationSeconds));
    return apiRequest<{ transcript: string; speechMetrics: SpeechMetricsDTO }>(
      `/interviews/${interviewId}/transcribe`,
      {
        method: "POST",
        body: form,
      }
    );
  },

  submitVoiceAnswer: (
    interviewId: string,
    questionId: string,
    audioBlob: Blob,
    durationSeconds: number
  ) => {
    const form = new FormData();
    const ext = audioBlob.type.includes("wav")
      ? ".wav"
      : audioBlob.type.includes("mp4")
      ? ".mp4"
      : audioBlob.type.includes("ogg")
      ? ".ogg"
      : ".webm";
    form.append("audio", audioBlob, `answer${ext}`);
    form.append("questionId", questionId);
    form.append("durationSeconds", String(durationSeconds));
    return apiRequest<InterviewSessionDTO>(`/interviews/${interviewId}/answer-voice`, {
      method: "POST",
      body: form,
    });
  },

  complete: (interviewId: string) =>
    apiRequest<InterviewSessionDTO>(`/interviews/${interviewId}/complete`, {
      method: "POST",
    }),

  delete: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/interviews/${id}`, {
      method: "DELETE",
    }),

  streamHint: async (
    interviewId: string,
    questionId: string | undefined,
    onToken: (token: string) => void
  ): Promise<void> => {
    const token = getAccessToken();
    const res = await fetch(`${API_BASE_URL}/interviews/${interviewId}/hint-stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ questionId }),
    });

    if (!res.ok || !res.body) {
      throw new Error("Could not open coaching hint stream");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const parsed = JSON.parse(payload) as { token?: string };
          if (parsed.token) onToken(parsed.token);
        } catch {
          // ignore partial chunks
        }
      }
    }
  },
};
