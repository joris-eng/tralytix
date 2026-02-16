"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/shared/api";
import { Candle, CandlesChart } from "@/features/chart/CandlesChart";

type CandlesResponse = {
  candles: Candle[];
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
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadCandles() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        symbol,
        asset: "FX",
        tf: timeframe,
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString()
      });

      const response = await apiFetch<CandlesResponse>(
        `/v1/marketdata/candles?${params.toString()}`
      );
      setCandles(response.candles ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load candles");
    } finally {
      setLoading(false);
    }
  }

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
        <button className="primary" onClick={loadCandles} disabled={loading}>
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
