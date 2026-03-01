import { z } from "zod";

export const analyticsSummarySchema = z.object({
  trades_count: z.number().optional(),
  winrate: z.number().optional(),
  avg_pnl: z.number().optional(),
  profit_factor: z.number().optional()
}).passthrough();

export const mt5AnalyticsSummarySchema = z.object({
  account_id: z.string().optional(),
  total_trades: z.number().optional(),
  total_profit: z.string().optional(),
  avg_profit: z.string().optional(),
  winners: z.number().optional(),
  losers: z.number().optional(),
  win_rate: z.string().optional(),
  profit_factor: z.string().optional(),
  max_profit: z.string().optional(),
  min_profit: z.string().optional(),
  last_imported_at: z.string().nullable().optional()
}).passthrough();

export const insightItemSchema = z.object({
  title: z.string(),
  detail: z.string(),
  severity: z.string()
});

export const recommendedActionSchema = z.object({
  title: z.string(),
  detail: z.string()
});

export const mt5InsightsSchema = z.object({
  score: z.number().optional(),
  label: z.string().optional(),
  top_insights: z.array(insightItemSchema).optional(),
  recommended_action: recommendedActionSchema.optional()
}).passthrough();

export const mt5EquityPointSchema = z.object({
  day: z.string(),
  equity: z.string()
});

export const mt5EquitySchema = z.object({
  points: z.array(mt5EquityPointSchema).default([])
});

export type AnalyticsSummaryModel = z.infer<typeof analyticsSummarySchema>;
export type Mt5AnalyticsSummaryModel = z.infer<typeof mt5AnalyticsSummarySchema>;
export type Mt5InsightsModel = z.infer<typeof mt5InsightsSchema>;
export type Mt5EquityModel = z.infer<typeof mt5EquitySchema>;

