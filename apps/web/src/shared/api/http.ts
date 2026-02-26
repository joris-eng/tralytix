import { getToken } from "@/shared/auth/token";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpQuery = Record<string, string | number | boolean | null | undefined>;

export class ApiHttpError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly payload?: unknown;

  constructor(message: string, status: number, code?: string, payload?: unknown) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

export type HttpRequestOptions = {
  auth?: boolean;
  query?: HttpQuery;
  headers?: HeadersInit;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
};

export type HttpClientConfig = {
  baseUrl: string;
  defaultTimeoutMs?: number;
};

function buildUrl(baseUrl: string, path: string, query?: HttpQuery): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = baseUrl.replace(/\/$/, "");
  const target = `${base}${normalizedPath}`;
  if (!query || Object.keys(query).length === 0) {
    return target;
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) {
      continue;
    }
    params.set(key, String(value));
  }
  const queryString = params.toString();
  return queryString ? `${target}?${queryString}` : target;
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createAbortSignal(timeoutMs: number, external?: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (external) {
    if (external.aborted) {
      controller.abort();
    } else {
      external.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  controller.signal.addEventListener(
    "abort",
    () => {
      clearTimeout(timeout);
    },
    { once: true }
  );

  return controller.signal;
}

export async function httpRequest<T>(
  client: HttpClientConfig,
  method: HttpMethod,
  path: string,
  options: HttpRequestOptions = {}
): Promise<T> {
  const auth = options.auth ?? true;
  const timeoutMs = options.timeoutMs ?? client.defaultTimeoutMs ?? 8000;
  const retries = options.retries ?? 0;
  const url = buildUrl(client.baseUrl, path, options.query);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const token = getToken();
  if (auth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (isFormData(options.body)) {
      body = options.body;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }
  }

  let attempt = 0;
  while (true) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: createAbortSignal(timeoutMs, options.signal)
      });

      const contentType = response.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");

      if (!response.ok) {
        const payload = isJson
          ? await response.json().catch(() => undefined)
          : await response.text().catch(() => undefined);

        const nestedError = isRecord(payload) && isRecord(payload.error) ? payload.error : undefined;
        const legacyErrorString = isRecord(payload) && typeof payload.error === "string" ? payload.error : undefined;
        const textPayload = typeof payload === "string" ? payload : undefined;
        const message =
          (nestedError && typeof nestedError.message === "string" ? nestedError.message : undefined) ??
          legacyErrorString ??
          textPayload ??
          `Request failed with status ${response.status}`;

        const code =
          (nestedError && typeof nestedError.code === "string" ? nestedError.code : undefined) ??
          (isRecord(payload) && typeof payload.code === "string" ? payload.code : undefined);

        const normalizedPayload =
          nestedError && "details" in nestedError ? nestedError.details : payload;

        throw new ApiHttpError(message, response.status, code, normalizedPayload);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      if (isJson) {
        return (await response.json()) as T;
      }

      return (await response.text()) as T;
    } catch (error) {
      const isRetryableHttp = error instanceof ApiHttpError && error.status >= 500;
      const isRetryableNetwork = error instanceof TypeError;
      if (attempt < retries && (isRetryableHttp || isRetryableNetwork)) {
        attempt += 1;
        continue;
      }
      throw error;
    }
  }
}

