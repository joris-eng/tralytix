import { apiClient } from "@/shared/api/apiClient";
import { healthSchema, versionSchema, type HealthModel, type VersionModel } from "@/features/health/model";

export async function getHealth(): Promise<HealthModel> {
  const payload = await apiClient.health();
  const parsed = healthSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid health response: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function getVersion(): Promise<VersionModel> {
  const payload = await apiClient.version();
  const parsed = versionSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid version response: ${parsed.error.message}`);
  }
  return parsed.data;
}

