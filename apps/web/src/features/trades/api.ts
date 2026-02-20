import { apiClient } from "@/shared/api/apiClient";
import { tradeCreateSchema, type TradeCreateInput } from "@/features/trades/model";

export async function listTrades(): Promise<unknown> {
  return apiClient.tradesList();
}

export async function createTrade(input: TradeCreateInput): Promise<unknown> {
  const parsed = tradeCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Invalid trade payload: ${parsed.error.message}`);
  }
  return apiClient.tradesCreate(parsed.data);
}

