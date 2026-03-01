export type TradeDirection = "LONG" | "SHORT";
export type TradingSession = "ASIA" | "LONDON" | "NEW_YORK";
export type CapitalBucket = "small" | "mid" | "large";
export type TradingStyle = "scalping" | "intraday" | "swing";

export type ProAnalysisTrade = {
  id: string;
  instrument: string;
  direction: TradeDirection;
  tag: string;
  session: TradingSession;
  openedAt: string;
  closedAt: string;
  pnl: number;
  rr: number;
  durationMin: number;
  entry: number;
  stop: number;
  target: number;
  close: number;
  notes: string;
};

export type ProPatternAlert = {
  id: string;
  level: "warning" | "success" | "neutral";
  title: string;
  detail: string;
  recommendation: string;
};

export type ProAnalysisFilters = {
  dateRange: string;
  instrument: string;
  direction: "ALL" | TradeDirection;
  tag: string;
  session: "ALL" | TradingSession;
};

export type ProAnalysisViewModel = {
  title: string;
  subtitle: string;
  filters: ProAnalysisFilters;
  capitalBucket: CapitalBucket;
  tradingStyle: TradingStyle;
  trades: ProAnalysisTrade[];
  alerts: ProPatternAlert[];
};
