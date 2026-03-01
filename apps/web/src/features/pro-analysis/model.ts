import { z } from "zod";

export type TradeDirection = "LONG" | "SHORT";
export type CapitalBucket = "small" | "mid" | "large";
export type TradingStyle = "scalping" | "intraday" | "swing";

export type ProAnalysisFilters = {
  dateRange: string;
  symbol: string;
  side: "ALL" | TradeDirection;
};

export const proAnalysisTradeSchema = z.object({
  ticket: z.string(),
  symbol: z.string(),
  side: z.enum(["LONG", "SHORT"]),
  volume: z.number(),
  open_price: z.number(),
  close_price: z.number().nullable().optional(),
  profit: z.number(),
  opened_at: z.string(),
  closed_at: z.string().nullable().optional(),
  commission: z.number(),
  swap: z.number()
});

export const proAnalysisTradesResponseSchema = z.object({
  trades: z.array(proAnalysisTradeSchema).default([]),
  total: z.number()
});

export type ProAnalysisTrade = z.infer<typeof proAnalysisTradeSchema>;
export type ProAnalysisTradesResponse = z.infer<typeof proAnalysisTradesResponseSchema>;
