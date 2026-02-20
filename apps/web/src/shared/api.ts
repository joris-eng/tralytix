import { httpClient } from "@/lib/http/client";
import { clearToken, getToken as readToken, setToken as writeToken } from "@/lib/auth/tokenStore";
import type { HttpMethod } from "@/lib/http/types";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
};

export function setToken(token: string): void {
  writeToken(token);
}

export function getToken(): string | null {
  return readToken();
}

export function clearTokenValue(): void {
  clearToken();
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  return httpClient.request<T>(options.method ?? "GET", path, {
    auth: options.auth ?? false,
    body: options.body
  });
}
