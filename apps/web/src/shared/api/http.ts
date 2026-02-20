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
  const url = new URL(`${baseUrl.replace(/\/$/, "")}${normalizedPath}`);
  if (!query) {
    return url.toString();
  }
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) {
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
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
        const payload = isJson ? await response.json().catch(() => undefined) : undefined;
        const message =
          (payload as { error?: string } | undefined)?.error ??
          `Request failed with status ${response.status}`;
        const code = (payload as { code?: string } | undefined)?.code;
        throw new ApiHttpError(message, response.status, code, payload);
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

