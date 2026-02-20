import { AUTH_ENDPOINTS } from "@/lib/api/endpoints";
import { httpClient } from "@/lib/http/client";
import { setToken } from "@/lib/auth/tokenStore";

export type DevLoginResponse = {
  token: string;
};

export async function devLogin(email: string): Promise<DevLoginResponse> {
  const response = await httpClient.request<DevLoginResponse>("POST", AUTH_ENDPOINTS.devLogin, {
    auth: false,
    body: { email }
  });
  setToken(response.token);
  return response;
}

