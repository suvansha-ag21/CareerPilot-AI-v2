import { apiRequest } from "@/lib/api";
export const skillsApi = {
    getInventory: () => apiRequest("/skills/inventory"),
    upsertSkill: (input) => apiRequest("/skills/inventory", {
        method: "PATCH",
        body: JSON.stringify(input),
    }),
    removeSkill: (userSkillId) => apiRequest(`/skills/inventory/${userSkillId}`, {
        method: "DELETE",
    }),
    analyzeGap: (input) => apiRequest("/skills/analyze", {
        method: "POST",
        body: JSON.stringify(input),
    }),
};
