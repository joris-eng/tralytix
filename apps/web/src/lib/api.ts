export class ApiError extends Error {
  readonly status: number;
  readonly payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type ApiFetchOptions = Omit<RequestInit, "headers"> & {
  token?: string;
  headers?: HeadersInit;
};

const LOCAL_API_BASE_URL = "http://localhost:8080";
const PROD_API_BASE_URL = "https://tralytix.onrender.com";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  (process.env.NODE_ENV === "production" ? PROD_API_BASE_URL : LOCAL_API_BASE_URL);

function normalizePath(path: string): string {
  if (!path) {
    return "/";
  }
  return path.startsWith("/") ? path : `/${path}`;
}

function getErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const nested = obj.error;
    if (nested && typeof nested === "object") {
      const nestedObj = nested as Record<string, unknown>;
      if (typeof nestedObj.message === "string" && nestedObj.message.trim()) {
        return nestedObj.message;
      }
    }
    if (typeof obj.message === "string" && obj.message.trim()) {
      return obj.message;
    }
  }
  return `Request failed with status ${status}`;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${normalizePath(path)}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJSON = contentType.includes("application/json");
  const payload: unknown = isJSON
    ? await response.json().catch(() => undefined)
    : await response.text().catch(() => undefined);

  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload, response.status), response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return payload as T;
}
