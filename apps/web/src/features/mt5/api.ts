import { apiClient } from "@/shared/api/apiClient";
import { mt5StatusSchema, type Mt5StatusModel } from "@/features/mt5/model";

export async function getMt5Status(): Promise<Mt5StatusModel> {
  const payload = await apiClient.mt5Status();
  const parsed = mt5StatusSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid MT5 status response: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function importMt5Csv(file: File): Promise<unknown> {
  return apiClient.mt5Import(file);
}

