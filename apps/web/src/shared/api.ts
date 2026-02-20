import { envDerived } from "@/shared/config/env";
import { clearToken, getToken as readToken, setToken as writeToken } from "@/shared/auth/token";
import { httpRequest, type HttpMethod } from "@/shared/api/http";

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
  return httpRequest<T>(
    { baseUrl: envDerived.apiRuntimeOrigin, defaultTimeoutMs: 8000 },
    options.method ?? "GET",
    path,
    { auth: options.auth ?? false, body: options.body }
  );
}
