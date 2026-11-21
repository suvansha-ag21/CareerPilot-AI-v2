import { apiRequest } from "@/lib/api";
export const roadmapApi = {
    list: () => apiRequest("/roadmaps"),
    getById: (id) => apiRequest(`/roadmaps/${id}`),
    generate: (input) => apiRequest("/roadmaps/generate", {
        method: "POST",
        body: JSON.stringify(input),
    }),
    activate: (id) => apiRequest(`/roadmaps/${id}/activate`, {
        method: "PATCH",
    }),
    updateTask: (roadmapId, taskId, input) => apiRequest(`/roadmaps/${roadmapId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    }),
    delete: (id) => apiRequest(`/roadmaps/${id}`, {
        method: "DELETE",
    }),
};
