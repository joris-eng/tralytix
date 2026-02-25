import { ApiError } from "@/lib/api";

export function isUnauthorized(e: unknown): boolean {
  return e instanceof ApiError && e.status === 401;
}
