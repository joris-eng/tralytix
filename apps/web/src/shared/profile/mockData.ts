import { TrendingUp, Award, Shield, Activity } from "lucide-react";
import type { ProfileData } from "./types";

export const mockProfileData: ProfileData = {
  radarData: [
    { metric: "Risk Control", value: 72, fullMark: 100 },
    { metric: "Consistency", value: 58, fullMark: 100 },
    { metric: "Win Rate", value: 31, fullMark: 100 },
    { metric: "Position Sizing", value: 68, fullMark: 100 },
    { metric: "Trade Frequency", value: 45, fullMark: 100 },
  ],
  behavioralRisks: [
    {
      title: "Overtrading after 3 consecutive losses",
      description: "Average loss increases by 47%",
      impact: "-2,450€",
      trades: 18,
      severity: "CRITICAL",
    },
    {
      title: "Performance drops during NY afternoon",
      description: "Win rate decreases to 28%",
      impact: "-1,830€",
      trades: 35,
      severity: "HIGH",
    },
    {
      title: "Position size increases emotionally",
      description: "Larger positions correlate with higher losses",
      impact: "-980€",
      trades: 24,
      severity: "MEDIUM",
    },
  ],
  equityData: {
    "1W": [
      { date: "Mon", equity: 14800, id: "1w1" },
      { date: "Tue", equity: 14950, id: "1w2" },
      { date: "Wed", equity: 14700, id: "1w3" },
      { date: "Thu", equity: 15100, id: "1w4" },
      { date: "Fri", equity: 15200, id: "1w5" },
    ],
    "1M": [
      { date: "W1", equity: 13200, id: "1m1" },
      { date: "W2", equity: 13800, id: "1m2" },
      { date: "W3", equity: 14200, id: "1m3" },
      { date: "W4", equity: 15200, id: "1m4" },
    ],
    "3M": [
      { date: "Jul", equity: 14500, id: "3m1" },
      { date: "Aug", equity: 13900, id: "3m2" },
      { date: "Sep", equity: 15200, id: "3m3" },
    ],
    "1Y": [
      { date: "Q1", equity: 10000, id: "1y1" },
      { date: "Q2", equity: 11500, id: "1y2" },
      { date: "Q3", equity: 13200, id: "1y3" },
      { date: "Q4", equity: 15200, id: "1y4" },
    ],
  },
  performanceScore: 72,
  globalPercentile: 63,
  categoryRankings: [
    {
      title: "Win Rate",
      percentile: 22,
      value: "64.2%",
      icon: TrendingUp,
      color: "emerald",
    },
    {
      title: "Profit Factor",
      percentile: 45,
      value: "1.42",
      icon: Award,
      color: "cyan",
    },
    {
      title: "Gestion des Risques",
      percentile: 18,
      value: "A-",
      icon: Shield,
      color: "purple",
    },
    {
      title: "Consistance",
      percentile: 31,
      value: "82/100",
      icon: Activity,
      color: "blue",
    },
  ],
};
