export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

export type RequestOptions = {
  auth?: boolean;
  headers?: HeadersInit;
  query?: QueryParams;
  body?: unknown;
  signal?: AbortSignal;
  retries?: number;
};

export type ApiErrorBody = {
  error?: string;
  code?: string;
};

