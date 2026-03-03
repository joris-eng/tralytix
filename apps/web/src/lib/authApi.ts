import { apiFetch } from "@/lib/api";

export type AuthMeResponse = {
  user_id: string;
  plan: "free" | "pro";
};

export async function fetchAuthMe(token: string): Promise<AuthMeResponse> {
  return apiFetch<AuthMeResponse>("/v1/auth/me", { token });
}
