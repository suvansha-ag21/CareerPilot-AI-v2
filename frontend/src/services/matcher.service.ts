import { JobMatchDTO, JobType } from "@careerpilot/shared";
import { apiRequest } from "@/lib/api";

export const matcherApi = {
  list: () => apiRequest<JobMatchDTO[]>("/job-matches"),

  getById: (id: string) => apiRequest<JobMatchDTO>(`/job-matches/${id}`),

  evaluate: (params: {
    resumeId: string;
    targetRole?: string;
    companyName?: string;
    experienceLevel?: string;
    jobType?: JobType;
    jobDescription?: string;
    jdFile?: File | null;
  }) => {
    if (params.jdFile) {
      const formData = new FormData();
      formData.append("resumeId", params.resumeId);
      if (params.targetRole?.trim()) formData.append("targetRole", params.targetRole.trim());
      if (params.companyName?.trim()) formData.append("companyName", params.companyName.trim());
      if (params.experienceLevel?.trim()) {
        formData.append("experienceLevel", params.experienceLevel.trim());
      }
      if (params.jobType) formData.append("jobType", params.jobType);
      if (params.jobDescription?.trim()) {
        formData.append("jobDescription", params.jobDescription.trim());
      }
      formData.append("jdFile", params.jdFile);

      return apiRequest<JobMatchDTO>("/job-matches", {
        method: "POST",
        body: formData,
      });
    }

    return apiRequest<JobMatchDTO>("/job-matches", {
      method: "POST",
      body: JSON.stringify({
        resumeId: params.resumeId,
        targetRole: params.targetRole?.trim() || undefined,
        companyName: params.companyName?.trim() || undefined,
        experienceLevel: params.experienceLevel?.trim() || undefined,
        jobType: params.jobType,
        jobDescription: params.jobDescription?.trim() || undefined,
      }),
    });
  },

  delete: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/job-matches/${id}`, {
      method: "DELETE",
    }),
};
