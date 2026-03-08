import { z } from "zod";

export type DashboardMode = "simple" | "pro";

export type HeroCardTone = "primary" | "warning" | "success" | "danger";

export type HeroMetric = {
  label: string;
  value: string;
  context: string;
  tone: HeroCardTone;
};

export type InsightModel = {
  id: string;
  title: string;
  interpretation: string;
  recommendation: string;
  ctaLabel: string;
  severity?: string; // "high" | "medium" | "low" from API
};

export type BreakdownModel = {
  id: string;
  label: "Edge" | "Risk" | "Discipline" | "Efficiency";
  score: string;
  detail: string;
  trendDirection: "up" | "down" | "flat";
};

export type TopLeakModel = {
  id: string;
  leak: string;
  impact: string;
  frequency: string;
  owner: string;
  status: "open" | "watch";
};

export type DashboardViewModel = {
  title: string;
  subtitle: string;
  rangeLabel: string;
  hero: {
    performanceScore: HeroMetric;
    winRate: HeroMetric;
    profitFactor: HeroMetric;
    totalProfit: HeroMetric;
  };
  insights: InsightModel[];
  breakdown: BreakdownModel[];
  topLeaks: TopLeakModel[];
};

export const dashboardSummarySchema = z.object({
  total_trades: z.number(),
  total_profit: z.string(),
  avg_profit: z.string(),
  winners: z.number(),
  losers: z.number(),
  win_rate: z.string(),
  profit_factor: z.string().nullable(),
  max_profit: z.string(),
  min_profit: z.string()
});

export const dashboardInsightItemSchema = z.object({
  title: z.string(),
  detail: z.string(),
  severity: z.string()
});

export const dashboardRecommendedActionSchema = z.object({
  title: z.string(),
  detail: z.string()
});

export const dashboardInsightsSchema = z.object({
  score: z.number(),
  label: z.string(),
  top_insights: z.array(dashboardInsightItemSchema).default([]),
  recommended_action: dashboardRecommendedActionSchema
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type DashboardInsights = z.infer<typeof dashboardInsightsSchema>;
