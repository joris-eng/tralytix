"use client";

import { ApiError } from "@/shared/ui/ApiError";
import { useStatsSummary } from "@/features/stats/hooks";

export function StatsCards() {
  const { data, loading, error, loadSummary } = useStatsSummary();

  return (
    <section className="card">
      <h1>Analytics Summary</h1>

      <button className="primary" onClick={loadSummary} disabled={loading}>
        {loading ? "Loading..." : "Load Summary"}
      </button>

      {error ? <ApiError message={error} /> : null}

      {data ? (
        <div className="grid" style={{ marginTop: 12 }}>
          <div className="card">
            <strong>Trades</strong>
            <p>{data.trades_count}</p>
          </div>

          <div className="card">
            <strong>Winrate</strong>
            <p>{(data.winrate * 100).toFixed(2)}%</p>
          </div>

          <div className="card">
            <strong>Avg PnL</strong>
            <p>{data.avg_pnl.toFixed(4)}</p>
          </div>

          <div className="card">
            <strong>Profit Factor</strong>
            <p>{data.profit_factor.toFixed(4)}</p>
          </div>
        </div>
      ) : (
        <p className="muted">No data loaded yet.</p>
      )}
    </section>
  );
}
