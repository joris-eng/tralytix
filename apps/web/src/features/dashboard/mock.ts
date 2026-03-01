import type { DashboardViewModel } from "@/features/dashboard/model";

export const dashboardViewModelMock: DashboardViewModel = {
  title: "Performance Intelligence",
  subtitle: "Actionable portfolio diagnostics powered by MT5 analytics.",
  rangeLabel: "Last 30 days",
  hero: {
    performanceScore: {
      label: "Performance score",
      value: "74",
      context: "Stable equity progression with moderate drawdown.",
      tone: "primary"
    },
    percentile: {
      label: "Percentile",
      value: "Top 28%",
      context: "Compared to accounts with similar trade frequency.",
      tone: "success"
    },
    consistency: {
      label: "Consistency",
      value: "63%",
      context: "Session-to-session variance remains manageable.",
      tone: "warning"
    }
  },
  insights: [
    {
      id: "insight-1",
      title: "Momentum setups outperform baseline",
      interpretation: "Momentum trades keep stronger reward/risk consistency this month.",
      recommendation: "Prioritize momentum setups during London and NY overlap.",
      ctaLabel: "Review setups"
    },
    {
      id: "insight-2",
      title: "Losses cluster after session transitions",
      interpretation: "Trade quality drops shortly after London close.",
      recommendation: "Apply a cooldown before opening positions post-transition.",
      ctaLabel: "Apply guardrail"
    }
  ],
  breakdown: [
    {
      id: "edge",
      label: "Edge",
      score: "78",
      detail: "Signal quality remains above baseline.",
      trendDirection: "up"
    },
    {
      id: "risk",
      label: "Risk",
      score: "64",
      detail: "Average loss is contained but still volatile on high-impact days.",
      trendDirection: "flat"
    },
    {
      id: "discipline",
      label: "Discipline",
      score: "69",
      detail: "Execution adherence improved versus prior month.",
      trendDirection: "up"
    },
    {
      id: "efficiency",
      label: "Efficiency",
      score: "58",
      detail: "Holding times are inconsistent across symbols.",
      trendDirection: "down"
    }
  ],
  topLeaks: [
    {
      id: "leak-1",
      leak: "Early entries",
      impact: "-2.1R / month",
      frequency: "12 events",
      owner: "Execution",
      status: "open"
    },
    {
      id: "leak-2",
      leak: "Overtrading after losses",
      impact: "-1.4R / month",
      frequency: "8 events",
      owner: "Discipline",
      status: "watch"
    }
  ]
};
