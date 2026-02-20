import { apiClient } from "@/shared/api/apiClient";
import { candlesQuerySchema, type CandlesQuery } from "@/features/marketdata/model";

export async function getCandles(query: CandlesQuery): Promise<unknown> {
  const parsed = candlesQuerySchema.safeParse(query);
  if (!parsed.success) {
    throw new Error(`Invalid candles query: ${parsed.error.message}`);
  }
  return apiClient.marketdataCandles(parsed.data);
}

