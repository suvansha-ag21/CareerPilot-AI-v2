export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? `${window.location.origin}/api`
    : "http://localhost:5000/api");

let accessToken = null;
let inflightRefresh = null;

export function setAccessToken(token) {
    accessToken = token;
}

export function getAccessToken() {
    return accessToken;
}

export class ApiClientError extends Error {
    status;
    code;
    details;
    constructor(status, code, message, details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

export async function refreshAccessToken() {
    if (!inflightRefresh) {
        inflightRefresh = (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
                    method: "POST",
                    credentials: "include",
                });
                if (!res.ok) {
                    accessToken = null;
                    return null;
                }
                const json = (await res.json());
                if (!json.success) {
                    accessToken = null;
                    return null;
                }
                accessToken = json.data.accessToken;
                return json.data.accessToken;
            }
            catch {
                accessToken = null;
                return null;
            }
            finally {
                inflightRefresh = null;
            }
        })();
    }
    const token = await inflightRefresh;
    if (!token)
        return null;
    const profileRes = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
    });
    if (!profileRes.ok)
        return null;
    const profileJson = (await profileRes.json());
    if (!profileJson.success)
        return null;
    return { accessToken: token, user: profileJson.data };
}

export async function apiRequest(path, options = {}) {
    const { skipAuth = false, retryOn401 = true, headers, ...rest } = options;
    const requestHeaders = new Headers(headers);
    if (!requestHeaders.has("Content-Type") && !(rest.body instanceof FormData)) {
        requestHeaders.set("Content-Type", "application/json");
    }
    if (!skipAuth && accessToken) {
        requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...rest,
        headers: requestHeaders,
        credentials: "include",
    });
    if (response.status === 401 && retryOn401 && !skipAuth) {
        const refreshed = await refreshAccessToken();
        if (refreshed?.accessToken) {
            return apiRequest(path, { ...options, retryOn401: false });
        }
    }
    const payload = (await response.json());
    if (!response.ok || !payload.success) {
        const err = !payload.success ? payload.error : undefined;
        throw new ApiClientError(response.status, err?.code ?? "REQUEST_FAILED", err?.message ?? "Request failed", err?.details);
    }
    return payload.data;
}

export async function apiFetchBlob(path, retryOn401 = true) {
    const headers = new Headers();
    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "GET",
        headers,
        credentials: "include",
    });
    if (response.status === 401 && retryOn401) {
        const refreshed = await refreshAccessToken();
        if (refreshed?.accessToken) {
            return apiFetchBlob(path, false);
        }
    }
    if (!response.ok) {
        throw new ApiClientError(response.status, "FILE_FETCH_FAILED", "Could not fetch file preview");
    }
    return response.blob();
}
