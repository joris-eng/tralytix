/**
 * @deprecated Compat layer.
 * Ne pas ajouter de nouveaux usages.
 * À migrer vers apiClient (src/shared/api/apiClient.ts) + features/*\/api.ts.
 */

import { env } from "@/shared/config/env";
import { httpRequest, type HttpMethod, type HttpQuery } from "@/shared/api/http";

export type ApiFetchOptions = {
  method?: HttpMethod;
  body?: unknown;
  query?: HttpQuery;
  auth?: boolean;
  headers?: HeadersInit;
  timeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
};

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  return httpRequest<T>(
    { baseUrl: env.apiBase, defaultTimeoutMs: 8000 },
    options.method ?? "GET",
    path,
    {
      auth: options.auth,
      body: options.body,
      query: options.query,
      headers: options.headers,
      timeoutMs: options.timeoutMs,
      retries: options.retries,
      signal: options.signal
    }
  );
}
