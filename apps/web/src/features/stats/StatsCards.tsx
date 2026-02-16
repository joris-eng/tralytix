"use client";

import { useState } from "react";
import { apiFetch } from "@/shared/api";

type SummaryResponse = {
  trades_count: number;
  winrate: number;
  avg_pnl: number;
  profit_factor: number;
};

export function StatsCards() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadSummary() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<SummaryResponse>("/v1/analytics/summary", {
        auth: true
      });
      setSummary(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load summary. Please login first."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h1>Analytics Summary</h1>
      <button className="primary" onClick={loadSummary} disabled={loading}>
        {loading ? "Loading..." : "Load Summary"}
      </button>
      {error ? <p className="error">{error}</p> : null}
      {summary ? (
        <div className="grid" style={{ marginTop: 12 }}>
          <div className="card">
            <strong>Trades</strong>
            <p>{summary.trades_count}</p>
          </div>
          <div className="card">
            <strong>Winrate</strong>
            <p>{(summary.winrate * 100).toFixed(2)}%</p>
          </div>
          <div className="card">
            <strong>Avg PnL</strong>
            <p>{summary.avg_pnl.toFixed(4)}</p>
          </div>
          <div className="card">
            <strong>Profit Factor</strong>
            <p>{summary.profit_factor.toFixed(4)}</p>
          </div>
        </div>
      ) : (
        <p className="muted">No data loaded yet.</p>
      )}
    </section>
  );
}
