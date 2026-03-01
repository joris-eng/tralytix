import type { ProAnalysisViewModel } from "@/features/pro-analysis/model";

export const proAnalysisViewModelMock: ProAnalysisViewModel = {
  title: "Pro Analysis",
  subtitle: "Drilldown workspace for trade-level diagnostics and pattern detection.",
  filters: {
    dateRange: "Last 30 days",
    instrument: "ALL",
    direction: "ALL",
    tag: "ALL",
    session: "ALL"
  },
  capitalBucket: "mid",
  tradingStyle: "intraday",
  trades: [
    {
      id: "t-1001",
      instrument: "EURUSD",
      direction: "LONG",
      tag: "Breakout",
      session: "LONDON",
      openedAt: "2026-02-20T08:34:00Z",
      closedAt: "2026-02-20T09:16:00Z",
      pnl: 164.2,
      rr: 2.1,
      durationMin: 42,
      entry: 1.0813,
      stop: 1.0798,
      target: 1.0841,
      close: 1.0834,
      notes: "Clean impulse and continuation after retest."
    },
    {
      id: "t-1002",
      instrument: "XAUUSD",
      direction: "SHORT",
      tag: "Reversion",
      session: "NEW_YORK",
      openedAt: "2026-02-19T14:42:00Z",
      closedAt: "2026-02-19T15:18:00Z",
      pnl: -86.5,
      rr: -0.9,
      durationMin: 36,
      entry: 2037.5,
      stop: 2041.2,
      target: 2031.1,
      close: 2039.2,
      notes: "Entry early versus confirmation."
    },
    {
      id: "t-1003",
      instrument: "NAS100",
      direction: "LONG",
      tag: "Momentum",
      session: "NEW_YORK",
      openedAt: "2026-02-18T15:06:00Z",
      closedAt: "2026-02-18T15:54:00Z",
      pnl: 242.8,
      rr: 2.6,
      durationMin: 48,
      entry: 17984.4,
      stop: 17942.1,
      target: 18068.8,
      close: 18052.5,
      notes: "Strong broad-market support."
    },
    {
      id: "t-1004",
      instrument: "GBPUSD",
      direction: "SHORT",
      tag: "Breakout",
      session: "LONDON",
      openedAt: "2026-02-17T09:11:00Z",
      closedAt: "2026-02-17T09:46:00Z",
      pnl: 118.6,
      rr: 1.8,
      durationMin: 35,
      entry: 1.2674,
      stop: 1.2692,
      target: 1.2643,
      close: 1.2658,
      notes: "Valid breakdown after failed retest."
    },
    {
      id: "t-1005",
      instrument: "USDJPY",
      direction: "LONG",
      tag: "Range",
      session: "ASIA",
      openedAt: "2026-02-16T01:18:00Z",
      closedAt: "2026-02-16T02:07:00Z",
      pnl: -52.3,
      rr: -0.6,
      durationMin: 49,
      entry: 149.82,
      stop: 149.51,
      target: 150.34,
      close: 149.67,
      notes: "Low momentum environment."
    },
    {
      id: "t-1006",
      instrument: "BTCUSD",
      direction: "LONG",
      tag: "Momentum",
      session: "NEW_YORK",
      openedAt: "2026-02-15T16:25:00Z",
      closedAt: "2026-02-15T17:40:00Z",
      pnl: 309.9,
      rr: 3.1,
      durationMin: 75,
      entry: 62340,
      stop: 61910,
      target: 63210,
      close: 63105,
      notes: "Strong continuation after reclaim."
    }
  ],
  alerts: [
    {
      id: "a-1",
      level: "warning",
      title: "Loss clustering after session transition",
      detail: "Trade quality weakens when opening positions right after London close.",
      recommendation: "Add a mandatory 20-minute cooldown at session transition."
    },
    {
      id: "a-2",
      level: "success",
      title: "Momentum setups outperform baseline",
      detail: "Momentum-tagged trades maintain 1.4x average reward-to-risk.",
      recommendation: "Prioritize momentum setups in capital bucket 'large'."
    },
    {
      id: "a-3",
      level: "neutral",
      title: "Range setups remain inconsistent",
      detail: "Range trades show high variance and lower follow-through.",
      recommendation: "Require extra confluence for range-tagged entries."
    }
  ]
};
