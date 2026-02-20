import type { ApiErrorBody, HttpMethod } from "@/lib/http/types";

export class HttpError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly payload?: ApiErrorBody;

  constructor(args: {
    status: number;
    method: HttpMethod;
    path: string;
    message: string;
    code?: string;
    payload?: ApiErrorBody;
  }) {
    super(args.message);
    this.name = "HttpError";
    this.status = args.status;
    this.code = args.code;
    this.method = args.method;
    this.path = args.path;
    this.payload = args.payload;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

