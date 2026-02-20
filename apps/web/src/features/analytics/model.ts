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
  win_rate: z.string().optional()
}).passthrough();

export const mt5InsightsSchema = z.object({
  score: z.number().optional(),
  label: z.string().optional(),
  top_insights: z.array(z.unknown()).optional()
}).passthrough();

