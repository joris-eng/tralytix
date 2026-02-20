import { apiClient } from "@/shared/api/apiClient";
import { clearToken, setToken } from "@/shared/auth/token";
import { devLoginResponseSchema, type DevLoginResponseModel } from "@/features/auth/model";

export async function devLogin(email: string): Promise<DevLoginResponseModel> {
  const payload = await apiClient.devLogin(email);
  const parsed = devLoginResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid login response: ${parsed.error.message}`);
  }
  setToken(parsed.data.token);
  return parsed.data;
}

export function logout(): void {
  clearToken();
}

