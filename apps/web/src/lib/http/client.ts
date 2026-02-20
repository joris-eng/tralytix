import { config } from "@/lib/config";
import { getToken } from "@/lib/auth/tokenStore";
import { HttpError, NetworkError } from "@/lib/http/errors";
import type { ApiErrorBody, HttpMethod, QueryParams, RequestOptions } from "@/lib/http/types";

function withLeadingSlash(path: string): string {
  if (path.startsWith("/")) {
    return path;
  }
  return `/${path}`;
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${base}${withLeadingSlash(path)}`;
}

function appendQuery(url: string, query?: QueryParams): string {
  if (!query) {
    return url;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          params.append(key, String(item));
        }
      }
      continue;
    }
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }

  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseApiErrorBody(response: Response): Promise<ApiErrorBody | undefined> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return undefined;
  }
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return undefined;
  }
}

export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  async request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
    const url = appendQuery(joinUrl(this.baseUrl, path), options.query);
    const authEnabled = options.auth ?? true;
    const retries = Math.max(0, options.retries ?? 0);

    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");

    if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    if (authEnabled) {
      const token = getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    let attempt = 0;
    while (true) {
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
          signal: options.signal
        });

        if (!response.ok) {
          const errorBody = await parseApiErrorBody(response);
          throw new HttpError({
            status: response.status,
            method,
            path,
            message:
              errorBody?.error ??
              `HTTP ${response.status} while calling ${method} ${withLeadingSlash(path)}`,
            code: errorBody?.code,
            payload: errorBody
          });
        }

        if (response.status === 204) {
          return undefined as T;
        }

        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.toLowerCase().includes("application/json")) {
          return (await response.json()) as T;
        }

        return (await response.text()) as T;
      } catch (error) {
        const retryableHttp = error instanceof HttpError && error.status >= 500;
        const retryableNetwork = error instanceof TypeError;
        if (attempt < retries && (retryableHttp || retryableNetwork)) {
          attempt++;
          continue;
        }
        if (error instanceof TypeError) {
          throw new NetworkError(`Network error while calling ${method} ${withLeadingSlash(path)}`);
        }
        throw error;
      }
    }
  }
}

export const httpClient = new HttpClient(config.apiBaseUrl);

