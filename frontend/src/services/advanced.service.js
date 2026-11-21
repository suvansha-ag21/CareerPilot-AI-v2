import { apiRequest } from "@/lib/api";
export const projectsApi = {
    listGitHub: () => apiRequest("/projects/github"),
    analyzeGitHub: (repoUrl) => apiRequest("/projects/analyze-github", {
        method: "POST",
        body: JSON.stringify({ repoUrl }),
    }),
    deleteGitHub: (id) => apiRequest(`/projects/github/${id}`, {
        method: "DELETE",
    }),
};
export const drillsApi = {
    list: () => apiRequest("/drills"),
    generate: (input) => apiRequest("/drills/generate", {
        method: "POST",
        body: JSON.stringify(input),
    }),
    review: (id, rating) => apiRequest(`/drills/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ rating }),
    }),
    delete: (id) => apiRequest(`/drills/${id}`, {
        method: "DELETE",
    }),
};
