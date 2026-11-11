import {
  InterviewSessionDTO,
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

  complete: (interviewId: string) =>
    apiRequest<InterviewSessionDTO>(`/interviews/${interviewId}/complete`, {
      method: "POST",
    }),

  delete: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/interviews/${id}`, {
      method: "DELETE",
    }),
};
