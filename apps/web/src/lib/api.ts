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

type ApiRequestBody = BodyInit | Record<string, unknown>;

type ApiFetchOptions = Omit<RequestInit, "headers" | "body"> & {
  method?: string;
  body?: ApiRequestBody;
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

  let requestBody: BodyInit | undefined;
  if (options.body !== undefined && options.body !== null) {
    if (
      typeof options.body === "string" ||
      options.body instanceof Blob ||
      options.body instanceof ArrayBuffer ||
      ArrayBuffer.isView(options.body) ||
      options.body instanceof URLSearchParams ||
      options.body instanceof FormData ||
      options.body instanceof ReadableStream
    ) {
      requestBody = options.body as BodyInit;
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      requestBody = JSON.stringify(options.body);
    }
  }

  const response = await fetch(`${API_BASE_URL}${normalizePath(path)}`, {
    ...options,
    body: requestBody,
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
