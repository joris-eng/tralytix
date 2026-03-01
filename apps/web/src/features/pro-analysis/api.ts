import { apiClient } from "@/shared/api/apiClient";
import {
  proAnalysisTradesResponseSchema,
  type ProAnalysisTradesResponse
} from "@/features/pro-analysis/model";

export async function fetchProAnalysisTrades(limit?: number, offset?: number): Promise<ProAnalysisTradesResponse> {
  const payload = await apiClient.mt5Trades(limit, offset);
  return proAnalysisTradesResponseSchema.parse(payload);
}
