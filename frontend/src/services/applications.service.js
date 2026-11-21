import { apiRequest } from "@/lib/api";
export const applicationsApi = {
    list: (params) => {
        const qs = new URLSearchParams();
        if (params?.status && params.status !== "ALL")
            qs.set("status", params.status);
        if (params?.jobType && params.jobType !== "ALL")
            qs.set("jobType", params.jobType);
        if (params?.search?.trim())
            qs.set("search", params.search.trim());
        const query = qs.toString() ? `?${qs.toString()}` : "";
        return apiRequest(`/applications${query}`);
    },
    create: (input) => apiRequest("/applications", {
        method: "POST",
        body: JSON.stringify(input),
    }),
    update: (id, input) => apiRequest(`/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    }),
    delete: (id) => apiRequest(`/applications/${id}`, {
        method: "DELETE",
    }),
};
export const analyticsApi = {
    detailed: () => apiRequest("/analytics/detailed"),
};
