"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid
} from "recharts";
import { useDashboardInsights, useDashboardSummary } from "@/features/dashboard/hooks";
import { useProAnalysisTrades } from "@/features/pro-analysis/hooks";
import { Skeleton } from "@/features/ui/primitives";
import { RequirePro } from "@/shared/auth/RequirePro";
import styles from "@/features/dashboard/ui/dashboard.module.css";

// ── helpers ──────────────────────────────────────────────────────────────────

function parseNum(v: string | null | undefined): number {
  if (!v) return 0;
  const n = parseFloat(v);
  return isFinite(n) ? n : 0;
}

function fmtPct(v: number) { return `${(v * 100).toFixed(1)}%`; }
function fmtDec(v: number, d = 2) { return v.toFixed(d); }
function fmtMoney(v: number) {
  const abs = Math.abs(v).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${v < 0 ? "- " : "+ "}$${abs}`;
}

function computeScore(winRate: number, pf: number) {
  return Math.round(Math.max(0, Math.min(100, winRate * 100)) * 0.6 + Math.max(0, Math.min(100, Math.min(pf, 2) * 50)) * 0.4);
}

function scoreRank(score: number) {
  if (score >= 80) return "Top 5% trader";
  if (score >= 60) return "Top 20% trader";
  if (score >= 40) return "Top 40% trader";
  return "Top 60% trader";
}

// ── Bar chart data from trades ────────────────────────────────────────────────

type TradeEntry = { opened_at: string; profit: string | number };

function buildTradeSeqData(trades: TradeEntry[]) {
  const byDay: Record<string, number[]> = {};
  for (const t of trades) {
    const day = t.opened_at.slice(0, 10);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(typeof t.profit === "string" ? parseFloat(t.profit) : t.profit);
  }

  const buckets: Record<string, number[]> = { "Trade 1": [], "Trade 2": [], "Trade 3": [], "Trade 4+": [] };
  for (const dayTrades of Object.values(byDay)) {
    dayTrades.forEach((profit, idx) => {
      const key = idx < 3 ? `Trade ${idx + 1}` : "Trade 4+";
      buckets[key].push(profit);
    });
  }

  return Object.entries(buckets).map(([name, values]) => ({
    name,
    value: values.length > 0 ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) : 0,
  }));
}

function tradeSeq13Avg(data: { name: string; value: number }[]) {
  const items = data.filter(d => d.name !== "Trade 4+");
  if (!items.length) return 0;
  return items.reduce((a, b) => a + b.value, 0) / items.length;
}

// ── Custom tooltip for equity ────────────────────────────────────────────────

function EquityTooltip({ active, payload, label }: { active?: boolean; payload?: {value: number}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#12161f",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 8,
      padding: "8px 12px",
      fontFamily: "var(--ui-font-mono)",
      fontSize: 12,
    }}>
      <div style={{ color: "var(--ui-color-text-muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ color: "var(--ui-color-primary)" }}>equity : {payload[0].value.toLocaleString()}</div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function DashboardV1Screen() {
  const [period, setPeriod] = useState("9 mois");
  const { data: summary, loading: sLoading, refresh: rSum } = useDashboardSummary();
  const { data: insights, loading: iLoading, refresh: rIns } = useDashboardInsights();
  const { data: tradesData, loading: tLoading, refresh: rTrades } = useProAnalysisTrades(200);

  useEffect(() => {
    void rSum();
    void rIns();
    void rTrades();
  }, [rSum, rIns, rTrades]);

  // Derived metrics
  const metrics = useMemo(() => {
    if (!summary) return null;
    const winRate = parseNum(summary.win_rate);
    const pf = parseNum(summary.profit_factor);
    const avgProfit = parseNum(summary.avg_profit);
    const totalProfit = parseNum(summary.total_profit);
    return { winRate, pf, avgProfit, totalProfit, score: computeScore(winRate, pf) };
  }, [summary]);

  // Bar chart data
  const seqData = useMemo(() => {
    if (!tradesData?.trades) return null;
    return buildTradeSeqData(tradesData.trades);
  }, [tradesData]);

  // Top insight
  const topInsight = useMemo(() => {
    if (!insights?.top_insights?.length) return null;
    return insights.top_insights[0];
  }, [insights]);

  const subtitle = useMemo(() => {
    if (!summary) return "Chargement…";
    const wr = parseNum(summary.win_rate);
    return [
      `${summary.total_trades} trades`,
      `${(wr * 100).toFixed(1)}% win rate`,
      "Derniers 90 jours"
    ];
  }, [summary]);

  const periods = ["3 mois", "6 mois", "9 mois", "1 an"];

  return (
    <div className={styles.page}>
      {/* ── Hero row ── */}
      <div className={styles.heroRow}>
        <div className={styles.heroLeft}>
          <h1 className={styles.dashTitle}>Dashboard</h1>
          <div className={styles.dashSubtitle}>
            {sLoading ? <Skeleton height={16} width="220px" /> : Array.isArray(subtitle) ? (
              subtitle.map((s, i) => (
                <span key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {i > 0 && <span className={styles.dashSubtitleDot} />}
                  {s}
                </span>
              ))
            ) : subtitle}
          </div>
        </div>

        <div className={styles.heroRight}>
          {sLoading ? (
            <Skeleton height={100} width="180px" />
          ) : metrics ? (
            <div className={styles.performanceCard}>
              <div className={styles.performanceLabel}>Performance Score</div>
              <div className={styles.performanceValue}>
                {metrics.score}
                <span className={styles.performanceMax}>/100</span>
              </div>
              <div className={styles.performanceSub}>{scoreRank(metrics.score)}</div>
            </div>
          ) : null}

          <div className={styles.heroActions}>
            <button className={styles.btnOutline} type="button">
              <span>📄</span> Export Monthly Report
            </button>
            <button className={styles.btnOutline} type="button">
              Derniers 30 jours
            </button>
          </div>
        </div>
      </div>

      {/* ── Top Performance Insight ── */}
      <RequirePro>
        {iLoading ? (
          <Skeleton height={280} />
        ) : topInsight ? (
          <div className={styles.insightCard}>
            <div className={styles.insightHeader}>
              <div className={styles.insightIconWrap}>⚠</div>
              <span className={styles.insightTitle}>Top Performance Insight</span>
              <span className={`${styles.insightBadge} ${
                topInsight.severity?.toLowerCase().includes("high") || topInsight.severity?.toLowerCase().includes("critical")
                  ? styles.insightBadgeCritical
                  : styles.insightBadgeWarning
              }`}>
                {topInsight.severity?.toUpperCase() ?? "INFO"}
              </span>
            </div>
            <div className={styles.insightSubtitle}>{topInsight.detail}</div>

            <div className={styles.insightBody}>
              {/* Bar chart */}
              <div className={styles.insightChartWrap}>
                <div className={styles.insightChartLabel}>Average Return by Trade Number</div>
                {tLoading || !seqData ? (
                  <Skeleton height={160} />
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={seqData} barCategoryGap="30%">
                      <XAxis
                        dataKey="name"
                        tick={{ fontFamily: "var(--ui-font-mono)", fontSize: 11, fill: "#8892a4" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontFamily: "var(--ui-font-mono)", fontSize: 10, fill: "#8892a4" }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {seqData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.value >= 0 ? "var(--ui-color-success)" : "var(--ui-color-danger)"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Stats + suggestion */}
              <div className={styles.insightStats}>
                {seqData && (
                  <>
                    <div className={styles.insightStatCard}>
                      <div className={styles.insightStatLabel}>Trade 1–3</div>
                      <div className={styles.insightStatValue} style={{ color: tradeSeq13Avg(seqData) >= 0 ? "var(--ui-color-success)" : "var(--ui-color-danger)" }}>
                        {tradeSeq13Avg(seqData) >= 0 ? "+" : ""}{fmtDec(tradeSeq13Avg(seqData), 1)}%
                      </div>
                      <div className={styles.insightStatSub}>avg per trade</div>
                    </div>
                    <div className={styles.insightStatCard}>
                      <div className={styles.insightStatLabel}>Trade 4+</div>
                      <div className={styles.insightStatValue} style={{ color: (seqData.find(d => d.name === "Trade 4+")?.value ?? 0) >= 0 ? "var(--ui-color-success)" : "var(--ui-color-danger)" }}>
                        {(seqData.find(d => d.name === "Trade 4+")?.value ?? 0) >= 0 ? "+" : ""}{fmtDec(seqData.find(d => d.name === "Trade 4+")?.value ?? 0, 1)}%
                      </div>
                      <div className={styles.insightStatSub}>avg per trade</div>
                    </div>
                  </>
                )}

                <div className={styles.insightSuggestion}>
                  <div className={styles.insightSuggestionTitle}>✦ Suggested Improvement</div>
                  <div className={styles.insightSuggestionText}>
                    Limit your daily trading sessions to{" "}
                    <span className={styles.insightSuggestionHighlight}>3 trades maximum</span>.
                    Your decision quality decreases significantly after the third trade, likely due to fatigue or overtrading.
                  </div>
                  <button className={styles.insightCTA} type="button">
                    Set Trade Limit →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </RequirePro>

      {/* ── KPI cards ── */}
      {sLoading ? (
        <div className={styles.kpiGrid}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} height={130} />)}
        </div>
      ) : metrics && summary ? (
        <div className={styles.kpiGrid}>
          <KpiCard
            label="Performance Score"
            icon="◎"
            value={String(metrics.score)}
            valueClass={styles.kpiValueCyan}
            context={`${summary.total_trades} trades analysés.\nTop ${scoreRank(metrics.score)}`}
            active
          />
          <KpiCard
            label="Win Rate"
            icon="↗"
            value={fmtPct(metrics.winRate)}
            valueClass={metrics.winRate >= 0.5 ? styles.kpiValueSuccess : metrics.winRate >= 0.4 ? styles.kpiValueWarning : styles.kpiValueDanger}
            context="Dérivé des trades clôturés."
          />
          <KpiCard
            label="Profit Factor"
            icon="▐"
            value={fmtDec(metrics.pf)}
            valueClass={metrics.pf >= 1.5 ? styles.kpiValueSuccess : metrics.pf >= 1 ? styles.kpiValueWarning : styles.kpiValueDanger}
            context={`PnL moy : ${fmtDec(metrics.avgProfit)}.`}
          />
          <KpiCard
            label="Profit Total"
            icon="$"
            value={fmtMoney(metrics.totalProfit)}
            valueClass={metrics.totalProfit >= 0 ? styles.kpiValueSuccess : styles.kpiValueDanger}
            context={`${summary.winners}G / ${summary.losers}P\nBest performing pair: EUR/USD`}
          />
        </div>
      ) : null}

      {/* ── Equity Curve ── */}
      <RequirePro>
        <EquityCurveSection period={period} periods={periods} onPeriod={setPeriod} />
      </RequirePro>
    </div>
  );
}

// ── KPI card sub-component ────────────────────────────────────────────────────

function KpiCard({ label, icon, value, valueClass, context, active }: {
  label: string; icon: string; value: string; valueClass?: string;
  context: string; active?: boolean;
}) {
  return (
    <div className={`${styles.kpiCard} ${active ? styles.kpiCardActive : ""}`}>
      <div className={styles.kpiHeader}>
        <span className={styles.kpiLabel}>{label}</span>
        <span className={styles.kpiIcon}>{icon}</span>
      </div>
      <div className={`${styles.kpiValue} ${valueClass ?? ""}`}>{value}</div>
      <div className={styles.kpiContext}>
        {context.split("\n").map((line, i) => <div key={i}>{line}</div>)}
      </div>
    </div>
  );
}

// ── Equity curve sub-component ────────────────────────────────────────────────

function EquityCurveSection({ period, periods, onPeriod }: {
  period: string; periods: string[]; onPeriod: (p: string) => void;
}) {
  const { data: tradesData, loading, refresh } = useProAnalysisTrades(500);

  useEffect(() => { void refresh(); }, [refresh]);

  const equityData = useMemo(() => {
    if (!tradesData?.trades) return [];
    const sorted = [...tradesData.trades].sort(
      (a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime()
    );
    let equity = 10000;
    const monthly: Record<string, number> = {};
    for (const t of sorted) {
      equity += typeof t.profit === "string" ? parseFloat(t.profit) : t.profit;
      const month = t.opened_at.slice(0, 7);
      monthly[month] = Math.round(equity);
    }
    return Object.entries(monthly).map(([month, value]) => ({
      name: new Date(month + "-01").toLocaleString("fr-FR", { month: "short" }),
      equity: value
    }));
  }, [tradesData]);

  return (
    <div className={styles.equitySection}>
      <div className={styles.equityHeader}>
        <div className={styles.equityTitle}>Equity Curve</div>
        <div className={styles.periodSelector}>
          {periods.map(p => (
            <button
              key={p}
              type="button"
              className={`${styles.periodBtn} ${period === p ? styles.periodBtnActive : ""}`}
              onClick={() => onPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Skeleton height={220} />
      ) : equityData.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={equityData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontFamily: "var(--ui-font-mono)", fontSize: 11, fill: "#8892a4" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontFamily: "var(--ui-font-mono)", fontSize: 10, fill: "#8892a4" }}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(v: number) => v.toLocaleString()}
            />
            <Tooltip content={<EquityTooltip />} cursor={{ stroke: "rgba(0,212,255,0.3)", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="#00d4ff"
              strokeWidth={2}
              fill="url(#equityGradient)"
              dot={false}
              activeDot={{ r: 5, fill: "#00d4ff", stroke: "#fff", strokeWidth: 1 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--ui-font-mono)", fontSize: "var(--ui-font-size-sm)", color: "var(--ui-color-text-subtle)" }}>
            Pas encore de données d&apos;equity.
          </span>
        </div>
      )}
    </div>
  );
}
