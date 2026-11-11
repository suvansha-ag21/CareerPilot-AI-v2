import {
  GenerateRoadmapInput,
  LearningRoadmapDTO,
  UpdateRoadmapTaskInput,
} from "@careerpilot/shared";
import { apiRequest } from "@/lib/api";

export const roadmapApi = {
  list: () => apiRequest<LearningRoadmapDTO[]>("/roadmaps"),

  getById: (id: string) => apiRequest<LearningRoadmapDTO>(`/roadmaps/${id}`),

  generate: (input: GenerateRoadmapInput) =>
    apiRequest<LearningRoadmapDTO>("/roadmaps/generate", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  activate: (id: string) =>
    apiRequest<LearningRoadmapDTO>(`/roadmaps/${id}/activate`, {
      method: "PATCH",
    }),

  updateTask: (roadmapId: string, taskId: string, input: UpdateRoadmapTaskInput) =>
    apiRequest<LearningRoadmapDTO>(`/roadmaps/${roadmapId}/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  delete: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/roadmaps/${id}`, {
      method: "DELETE",
    }),
};
