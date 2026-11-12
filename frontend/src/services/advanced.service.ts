import {
  FlashcardDrillDTO,
  GenerateDrillsInput,
  GitHubRepoAnalysisDTO,
} from "@careerpilot/shared";
import { apiRequest } from "@/lib/api";

export const projectsApi = {
  listGitHub: () => apiRequest<GitHubRepoAnalysisDTO[]>("/projects/github"),

  analyzeGitHub: (repoUrl: string) =>
    apiRequest<GitHubRepoAnalysisDTO>("/projects/analyze-github", {
      method: "POST",
      body: JSON.stringify({ repoUrl }),
    }),

  deleteGitHub: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/projects/github/${id}`, {
      method: "DELETE",
    }),
};

export const drillsApi = {
  list: () => apiRequest<FlashcardDrillDTO[]>("/drills"),

  generate: (input: GenerateDrillsInput) =>
    apiRequest<FlashcardDrillDTO[]>("/drills/generate", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  review: (id: string, rating: 1 | 2 | 3 | 4) =>
    apiRequest<FlashcardDrillDTO>(`/drills/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ rating }),
    }),

  delete: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/drills/${id}`, {
      method: "DELETE",
    }),
};
