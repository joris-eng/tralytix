export type DashboardMode = "simple" | "pro";

export type HeroCardTone = "primary" | "warning" | "success";

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
    percentile: HeroMetric;
    consistency: HeroMetric;
  };
  insights: InsightModel[];
  breakdown: BreakdownModel[];
  topLeaks: TopLeakModel[];
};
