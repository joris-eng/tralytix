import { apiClient } from "@/shared/api/apiClient";
import {
  tradeCreateSchema,
  tradesListSchema,
  type TradeCreateInput,
  type TradeModel
} from "@/features/trades/model";

export async function listTrades(): Promise<TradeModel[]> {
  const payload = await apiClient.tradesList();
  const parsed = tradesListSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid trades response: ${parsed.error.message}`);
  }
  return parsed.data.trades;
}

export async function createTrade(input: TradeCreateInput): Promise<unknown> {
  const parsed = tradeCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Invalid trade payload: ${parsed.error.message}`);
  }
  return apiClient.tradesCreate(parsed.data);
}

