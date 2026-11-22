function resolveApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, "");
    return clean.endsWith("/api") ? clean : `${clean}/api`;
  }
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return "https://careerpilot-ai-v2-zkuo.onrender.com/api";
  }
  return "http://localhost:5000/api";
}

export const API_BASE_URL = resolveApiBaseUrl();

export function buildUrl(path) {
  let cleanPath = (path || "").trim();
  if (cleanPath.startsWith("/api/")) {
    cleanPath = cleanPath.slice(4);
  } else if (cleanPath === "/api") {
    cleanPath = "";
  }
  if (!cleanPath.startsWith("/")) {
    cleanPath = `/${cleanPath}`;
  }
  return `${API_BASE_URL}${cleanPath}`;
}

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
                const res = await fetch(buildUrl("/auth/refresh"), {
                    method: "POST",
                    credentials: "include",
                });
                if (!res.ok) {
                    accessToken = null;
                    return null;
                }
                const text = await res.text();
                const json = text ? JSON.parse(text) : {};
                if (!json.success || !json.data?.accessToken) {
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
    try {
        const profileRes = await fetch(buildUrl("/auth/me"), {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
        });
        if (!profileRes.ok)
            return null;
        const profileText = await profileRes.text();
        const profileJson = profileText ? JSON.parse(profileText) : {};
        if (!profileJson.success)
            return null;
        return { accessToken: token, user: profileJson.data };
    }
    catch {
        return null;
    }
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
    const url = buildUrl(path);
    const response = await fetch(url, {
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
    let payload = null;
    const text = await response.text();
    try {
        payload = text ? JSON.parse(text) : {};
    }
    catch {
        if (!response.ok) {
            throw new ApiClientError(
                response.status,
                `HTTP_ERROR_${response.status}`,
                response.statusText || `Request failed with status ${response.status}`
            );
        }
        payload = {};
    }
    if (!response.ok || !payload.success) {
        const err = !payload.success ? payload.error : undefined;
        const message = typeof err === "string"
            ? err
            : err?.message ?? payload.message ?? payload.detail ?? "Request failed";
        throw new ApiClientError(response.status, err?.code ?? "REQUEST_FAILED", message, err?.details);
    }
    return payload.data;
}

export async function apiFetchBlob(path, retryOn401 = true) {
    const headers = new Headers();
    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }
    const url = buildUrl(path);
    const response = await fetch(url, {
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
