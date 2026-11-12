import {
  CreateJobApplicationInput,
  DetailedAnalyticsDTO,
  JobApplicationDTO,
  UpdateJobApplicationInput,
} from "@careerpilot/shared";
import { apiRequest } from "@/lib/api";

export const applicationsApi = {
  list: (params?: { status?: string; jobType?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== "ALL") qs.set("status", params.status);
    if (params?.jobType && params.jobType !== "ALL") qs.set("jobType", params.jobType);
    if (params?.search?.trim()) qs.set("search", params.search.trim());
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return apiRequest<JobApplicationDTO[]>(`/applications${query}`);
  },

  create: (input: CreateJobApplicationInput) =>
    apiRequest<JobApplicationDTO>("/applications", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: UpdateJobApplicationInput) =>
    apiRequest<JobApplicationDTO>(`/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  delete: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/applications/${id}`, {
      method: "DELETE",
    }),
};

export const analyticsApi = {
  detailed: () => apiRequest<DetailedAnalyticsDTO>("/analytics/detailed"),
};
