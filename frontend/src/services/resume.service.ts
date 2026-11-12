import {
  AnalyzeResumeOptionsInput,
  ResumeDTO,
  TailorResumeInput,
  TailoredResumeDTO,
} from "@careerpilot/shared";
import { apiFetchBlob, apiRequest } from "@/lib/api";

export const resumeApi = {
  list: () => apiRequest<ResumeDTO[]>("/resumes"),

  getById: (id: string) => apiRequest<ResumeDTO>(`/resumes/${id}`),

  upload: (file: File, title?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (title?.trim()) {
      formData.append("title", title.trim());
    }
    return apiRequest<ResumeDTO>("/resumes/upload", {
      method: "POST",
      body: formData,
    });
  },

  analyze: (id: string, options?: AnalyzeResumeOptionsInput) =>
    apiRequest<ResumeDTO>(`/resumes/${id}/analyze`, {
      method: "POST",
      body: options ? JSON.stringify(options) : JSON.stringify({}),
    }),

  setPrimary: (id: string) =>
    apiRequest<ResumeDTO>(`/resumes/${id}/primary`, {
      method: "PATCH",
    }),

  syncSkills: (id: string) =>
    apiRequest<{ syncedCount: number }>(`/resumes/${id}/sync-skills`, {
      method: "POST",
    }),

  delete: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/resumes/${id}`, {
      method: "DELETE",
    }),

  fetchFileBlob: (id: string) => apiFetchBlob(`/resumes/${id}/file`),

  tailor: (id: string, input: TailorResumeInput) =>
    apiRequest<TailoredResumeDTO>(`/resumes/${id}/tailor`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
