"use client";
import { useChartCandles } from "@/features/chart/hooks";
import { useEffect, useMemo, useState } from "react";
import { CandlesChart } from "@/features/chart/CandlesChart";

const CHART_UI_PREFS_KEY = "chart_ui_prefs_v1";

type ChartUIPrefs = {
  symbol: string;
  timeframe: string;
  from: string;
  to: string;
};

function toLocalInputValue(date: Date): string {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function ChartView() {
  const now = useMemo(() => new Date(), []);
  const initialFrom = useMemo(
    () => new Date(now.getTime() - 48 * 60 * 60 * 1000),
    [now]
  );

  const [symbol, setSymbol] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("1h");
  const [from, setFrom] = useState(toLocalInputValue(initialFrom));
  const [to, setTo] = useState(toLocalInputValue(now));
  const { candles, loading, error, loadCandles, hydrateFromCache } = useChartCandles();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const raw = window.localStorage.getItem(CHART_UI_PREFS_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Partial<ChartUIPrefs>;
      if (typeof parsed.symbol === "string" && parsed.symbol.trim()) {
        setSymbol(parsed.symbol.trim().toUpperCase());
      }
      if (isValidTimeframe(parsed.timeframe)) {
        setTimeframe(parsed.timeframe);
      }
      if (isValidLocalDateTimeInput(parsed.from)) {
        setFrom(parsed.from);
      }
      if (isValidLocalDateTimeInput(parsed.to)) {
        setTo(parsed.to);
      }
    } catch {
      // Ignore invalid persisted data and keep defaults.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const payload: ChartUIPrefs = { symbol, timeframe, from, to };
    window.localStorage.setItem(CHART_UI_PREFS_KEY, JSON.stringify(payload));
  }, [symbol, timeframe, from, to]);

  useEffect(() => {
    hydrateFromCache({ symbol, timeframe, from, to });
  }, [symbol, timeframe, from, to, hydrateFromCache]);

  return (
    <section className="card">
      <h1>Marketdata Chart</h1>
      <div className="row" style={{ marginBottom: 12 }}>
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Symbol"
        />
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          aria-label="Timeframe"
        >
          <option value="1h">1h</option>
          <option value="15m">15m</option>
          <option value="4h">4h</option>
          <option value="1d">1d</option>
        </select>
        <input
          type="datetime-local"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="primary" onClick={() => loadCandles({ symbol, timeframe, from, to })} disabled={loading}>
          {loading ? "Loading..." : "Load Candles"}
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {candles.length > 0 ? (
        <CandlesChart data={candles} />
      ) : (
        <p className="muted">No candles loaded yet.</p>
      )}
    </section>
  );
}

function isValidTimeframe(value: unknown): value is string {
  return value === "15m" || value === "1h" || value === "4h" || value === "1d";
}

function isValidLocalDateTimeInput(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }
  return !Number.isNaN(new Date(value).getTime());
}
