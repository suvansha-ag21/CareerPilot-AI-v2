import { ApiResponse, AuthResponseData } from "@careerpilot/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

let accessToken: string | null = null;
let inflightRefresh: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function refreshAccessToken(): Promise<AuthResponseData | null> {
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
        const json = (await res.json()) as ApiResponse<AuthResponseData>;
        if (!json.success) {
          accessToken = null;
          return null;
        }
        accessToken = json.data.accessToken;
        return json.data.accessToken;
      } catch {
        accessToken = null;
        return null;
      } finally {
        inflightRefresh = null;
      }
    })();
  }

  const token = await inflightRefresh;
  if (!token) return null;

  // Fetch user profile after silent refresh if needed by caller
  const profileRes = await fetch(`${API_BASE_URL}/profile`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  if (!profileRes.ok) return null;
  const profileJson = (await profileRes.json()) as ApiResponse<AuthResponseData["user"]>;
  if (!profileJson.success) return null;

  return { accessToken: token, user: profileJson.data };
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  retryOn401?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
      return apiRequest<T>(path, { ...options, retryOn401: false });
    }
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    const err = !payload.success ? payload.error : undefined;
    throw new ApiClientError(
      response.status,
      err?.code ?? "REQUEST_FAILED",
      err?.message ?? "Request failed",
      err?.details
    );
  }

  return payload.data;
}
