import {
  InterviewSessionDTO,
  SpeechMetricsDTO,
  StartInterviewInput,
  SubmitInterviewAnswerInput,
} from "@careerpilot/shared";
import { apiRequest } from "@/lib/api";

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
};
