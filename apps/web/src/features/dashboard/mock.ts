import type { DashboardViewModel } from "@/features/dashboard/model";

export const dashboardViewModelMock: DashboardViewModel = {
  title: "Performance Intelligence",
  subtitle: "Signal-first overview focused on actionable improvements.",
  rangeLabel: "Last 30 sessions",
  hero: {
    performanceScore: {
      label: "Performance Score",
      value: "74 / 100",
      context: "+4 vs previous window",
      tone: "primary"
    },
    percentile: {
      label: "Percentile",
      value: "Top 28%",
      context: "Peer benchmark (simulated)",
      tone: "success"
    },
    consistency: {
      label: "Consistency",
      value: "68%",
      context: "Stability index across setups",
      tone: "warning"
    }
  },
  insights: [
    {
      id: "insight-1",
      title: "Execution quality improves in the first two hours",
      interpretation: "Your best expectancy appears in the opening session with lower variance.",
      recommendation: "Concentrate size allocation on the highest-confidence opening setups.",
      ctaLabel: "Apply Session Bias"
    },
    {
      id: "insight-2",
      title: "Late-session overtrading erodes edge",
      interpretation: "Trade frequency rises while average quality drops after your core window.",
      recommendation: "Set an automated cutoff and require confirmation for trades after cutoff.",
      ctaLabel: "Set Cutoff Rule"
    },
    {
      id: "insight-3",
      title: "Risk discipline is uneven after consecutive losses",
      interpretation: "Position sizing deviates from baseline after two losing trades in sequence.",
      recommendation: "Lock position size for the next three trades after a loss streak.",
      ctaLabel: "Enable Loss-Streak Guard"
    }
  ],
  breakdown: [
    {
      id: "breakdown-edge",
      label: "Edge",
      score: "72",
      detail: "Signal quality remains positive but not yet resilient.",
      trendDirection: "up"
    },
    {
      id: "breakdown-risk",
      label: "Risk",
      score: "63",
      detail: "Drawdown containment needs tighter guardrails.",
      trendDirection: "flat"
    },
    {
      id: "breakdown-discipline",
      label: "Discipline",
      score: "69",
      detail: "Rule adherence slips during high-volatility periods.",
      trendDirection: "down"
    },
    {
      id: "breakdown-efficiency",
      label: "Efficiency",
      score: "77",
      detail: "Capital utilization is strong on prioritized setups.",
      trendDirection: "up"
    }
  ],
  topLeaks: [
    {
      id: "leak-1",
      leak: "Sizing drift after 2 losses",
      impact: "High",
      frequency: "12 occurrences",
      owner: "Risk Playbook",
      status: "open"
    },
    {
      id: "leak-2",
      leak: "Unplanned late-session entries",
      impact: "Medium",
      frequency: "9 occurrences",
      owner: "Session Rules",
      status: "open"
    },
    {
      id: "leak-3",
      leak: "Stops widened manually",
      impact: "Medium",
      frequency: "6 occurrences",
      owner: "Execution Checklist",
      status: "watch"
    }
  ]
};
