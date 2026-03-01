"use client";

import { useEffect } from "react";
import { useAnalytics } from "@/features/analytics/hooks";
import { ApiError } from "@/shared/ui/ApiError";
import { JsonBlock } from "@/shared/ui/JsonBlock";

function safeNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number" && Number.isFinite(value)) return value.toFixed(2);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : String(value);
}

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = [headers, ...rows]
    .map((line) => line.map(escapeCell).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function AnalyticsCard() {
  const { data, loading, error, refresh, recompute, recomputeResult } = useAnalytics();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const score = data?.insights.score;
  const label = data?.insights.label ?? "-";
  const totalTrades = data?.mt5Summary.total_trades ?? data?.summary.trades_count;
  const winRate = data?.mt5Summary.win_rate ?? (data?.summary.winrate !== undefined ? `${(data.summary.winrate * 100).toFixed(1)}%` : undefined);
  const totalProfit = data?.mt5Summary.total_profit;
  const avgProfit = data?.mt5Summary.avg_profit ?? (data?.summary.avg_pnl !== undefined ? String(data.summary.avg_pnl) : undefined);
  const equityPoints = data?.equity.points ?? [];
  const insights = data?.insights.top_insights ?? [];

  const exportEquityCsv = () => {
    if (equityPoints.length === 0) return;
    const rows = equityPoints.map((point) => [point.day, point.equity]);
    downloadCsv("analytics-equity.csv", ["day", "equity"], rows);
  };

  return (
    <section className="card">
      <h2>Analytics</h2>
      <div className="row">
        <button className="primary" onClick={() => void refresh()} disabled={loading}>
          {loading ? "Loading..." : "Refresh analytics"}
        </button>
        <button onClick={() => void recompute()} disabled={loading}>
          Recompute daily
        </button>
        <button onClick={exportEquityCsv} disabled={loading || equityPoints.length === 0}>
          Export equity CSV
        </button>
      </div>
      {error ? <ApiError message={error} /> : null}
      {recomputeResult ? <JsonBlock value={{ recompute: recomputeResult }} /> : null}
      {data ? (
        <>
          <div className="row">
            <div>
              <strong>Readiness score:</strong> {score ?? "-"} / 100 ({label})
            </div>
            <div>
              <strong>Total trades:</strong> {totalTrades ?? "-"}
            </div>
          </div>
          <div className="row">
            <div>
              <strong>Win rate:</strong> {winRate ?? "-"}
            </div>
            <div>
              <strong>Total profit:</strong> {safeNumber(totalProfit)}
            </div>
            <div>
              <strong>Avg profit:</strong> {safeNumber(avgProfit)}
            </div>
          </div>
          {insights.length > 0 ? (
            <div>
              <strong>Top insights</strong>
              <ul>
                {insights.map((insight) => (
                  <li key={`${insight.title}-${insight.severity}`}>
                    [{insight.severity}] {insight.title} - {insight.detail}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {data.insights.recommended_action ? (
            <p>
              <strong>Recommended action:</strong> {data.insights.recommended_action.title} -{" "}
              {data.insights.recommended_action.detail}
            </p>
          ) : null}
          {equityPoints.length > 0 ? (
            <p>
              <strong>Equity points:</strong> {equityPoints.length}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

