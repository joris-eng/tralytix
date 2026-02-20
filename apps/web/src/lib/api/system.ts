import { SYSTEM_ENDPOINTS } from "@/lib/api/endpoints";
import { httpClient } from "@/lib/http/client";

export type HealthResponse = {
  status: string;
  db?: string;
};

export type VersionResponse = {
  name: string;
  version: string;
};

export async function health(): Promise<HealthResponse> {
  return httpClient.request<HealthResponse>("GET", SYSTEM_ENDPOINTS.health, {
    auth: false
  });
}

export async function version(): Promise<VersionResponse> {
  return httpClient.request<VersionResponse>("GET", SYSTEM_ENDPOINTS.version, {
    auth: false
  });
}

