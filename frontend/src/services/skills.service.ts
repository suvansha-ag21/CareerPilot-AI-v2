import {
  AnalyzeSkillGapInput,
  CurrentCandidateSkillDTO,
  SkillCategory,
  SkillGapReportDTO,
  UpsertUserSkillInput,
} from "@careerpilot/shared";
import { apiRequest } from "@/lib/api";

export interface SkillCatalogEntry {
  id: string;
  name: string;
  normalizedName: string;
  category: SkillCategory;
}

export interface SkillInventoryResponse {
  userSkills: CurrentCandidateSkillDTO[];
  catalog: SkillCatalogEntry[];
}

export const skillsApi = {
  getInventory: () => apiRequest<SkillInventoryResponse>("/skills/inventory"),

  upsertSkill: (input: UpsertUserSkillInput) =>
    apiRequest<CurrentCandidateSkillDTO>("/skills/inventory", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  removeSkill: (userSkillId: string) =>
    apiRequest<{ deleted: boolean }>(`/skills/inventory/${userSkillId}`, {
      method: "DELETE",
    }),

  analyzeGap: (input: AnalyzeSkillGapInput) =>
    apiRequest<SkillGapReportDTO>("/skills/analyze", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
