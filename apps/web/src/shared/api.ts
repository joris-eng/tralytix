const API_BASE_URL = "http://localhost:8080";
const TOKEN_KEY = "trading_saas_token";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

type ApiError = {
  error?: string;
};

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };

  if (options.auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    let apiError: ApiError | undefined;
    try {
      apiError = (await response.json()) as ApiError;
    } catch {
      apiError = undefined;
    }
    throw new Error(
      apiError?.error ??
        `HTTP ${response.status} while calling ${options.method ?? "GET"} ${path}`
    );
  }

  return (await response.json()) as T;
}
