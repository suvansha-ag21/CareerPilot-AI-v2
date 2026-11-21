import { apiFetchBlob, apiRequest } from "@/lib/api";
export const resumeApi = {
    list: () => apiRequest("/resumes"),
    getById: (id) => apiRequest(`/resumes/${id}`),
    upload: (file, title) => {
        const formData = new FormData();
        formData.append("file", file);
        if (title?.trim()) {
            formData.append("title", title.trim());
        }
        return apiRequest("/resumes/upload", {
            method: "POST",
            body: formData,
        });
    },
    analyze: (id, options) => apiRequest(`/resumes/${id}/analyze`, {
        method: "POST",
        body: options ? JSON.stringify(options) : JSON.stringify({}),
    }),
    setPrimary: (id) => apiRequest(`/resumes/${id}/primary`, {
        method: "PATCH",
    }),
    syncSkills: (id) => apiRequest(`/resumes/${id}/sync-skills`, {
        method: "POST",
    }),
    delete: (id) => apiRequest(`/resumes/${id}`, {
        method: "DELETE",
    }),
    fetchFileBlob: (id) => apiFetchBlob(`/resumes/${id}/file`),
    tailor: (id, input) => apiRequest(`/resumes/${id}/tailor`, {
        method: "POST",
        body: JSON.stringify(input),
    }),
};
