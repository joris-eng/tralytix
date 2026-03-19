import { z } from "zod";

export const ReviewSchema = z.object({
  id: z.string(),
  trade_id: z.number(),
  rating: z.number().min(0).max(5),
  setup_tag: z.string(),
  notes: z.string(),
  key_learnings: z.array(z.string()),
  reviewed_at: z.string(),
});

export const TradeWithReviewSchema = z.object({
  trade_id: z.number(),
  symbol: z.string(),
  side: z.string(),
  profit: z.number(),
  entry_price: z.number(),
  close_price: z.number(),
  opened_at: z.string(),
  closed_at: z.string(),
  review: ReviewSchema.nullable().optional(),
});

export const ReviewStatsSchema = z.object({
  reviewed: z.number(),
  pending: z.number(),
  avg_rating: z.number(),
  total_insights: z.number(),
});

export const ReviewListResponseSchema = z.object({
  trades: z.array(TradeWithReviewSchema),
  stats: ReviewStatsSchema,
});

export type Review = z.infer<typeof ReviewSchema>;
export type TradeWithReview = z.infer<typeof TradeWithReviewSchema>;
export type ReviewStats = z.infer<typeof ReviewStatsSchema>;
export type ReviewListResponse = z.infer<typeof ReviewListResponseSchema>;

export interface UpsertReviewPayload {
  rating: number;
  setup_tag: string;
  notes: string;
  key_learnings: string[];
}

export const SETUP_TAGS = [
  "Breakout retest",
  "Reversal",
  "Momentum",
  "Range bounce",
  "Trend continuation",
  "Divergence RSI",
  "Support/Résistance",
  "Scalp",
  "News play",
  "Autre",
];
