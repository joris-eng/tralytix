import type { LucideIcon } from "lucide-react";

export interface RadarMetric {
  metric: string;
  value: number;
  fullMark: number;
}

export type RiskSeverity = "CRITICAL" | "HIGH" | "MEDIUM";

export interface BehavioralRisk {
  title: string;
  description: string;
  impact: string;
  trades: number;
  severity: RiskSeverity;
}

export type EquityPeriod = "1W" | "1M" | "3M" | "1Y";

export interface EquityDataPoint {
  date: string;
  equity: number;
  id: string;
}

export interface CategoryRanking {
  title: string;
  percentile: number;
  value: string;
  icon: LucideIcon;
  color: string;
}

export interface ColorClasses {
  bg: string;
  border: string;
  text: string;
}

export interface SeverityColors extends ColorClasses {
  leftBorder: string;
}

export interface ProfileData {
  radarData: RadarMetric[];
  behavioralRisks: BehavioralRisk[];
  equityData: Record<EquityPeriod, EquityDataPoint[]>;
  performanceScore: number;
  globalPercentile: number;
  categoryRankings: CategoryRanking[];
}
