"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboardInsights, useDashboardSummary } from "@/features/dashboard/hooks";
import type { BreakdownModel, DashboardInsights, DashboardMode, DashboardSummary, InsightModel, TopLeakModel } from "@/features/dashboard/model";
import { BreakdownSection } from "@/features/dashboard/ui/BreakdownSection";
import { DashboardHeader } from "@/features/dashboard/ui/DashboardHeader";
import { HeroCards } from "@/features/dashboard/ui/HeroCards";
import { InsightCardsSection } from "@/features/dashboard/ui/InsightCardsSection";
import { TopLeaksSection } from "@/features/dashboard/ui/TopLeaksSection";
import { Card, Heading, Skeleton, Text } from "@/features/ui/primitives";
import styles from "@/features/dashboard/ui/dashboardV1.module.css";

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDecimal(value: number): string {
  return value.toFixed(2);
}

function mapBreakdown(summary: DashboardSummary | null): BreakdownModel[] {
  if (!summary) return [];

  const edgeScore = Math.max(0, Math.min(100, Math.round(summary.winrate * 100)));
  const riskScore = Math.max(0, Math.min(100, Math.round(Math.min(summary.profit_factor, 2) * 40)));
  const disciplineScore = Math.max(0, Math.min(100, Math.round((summary.profit_factor / 2) * 100)));
  const efficiencyScore = Math.max(0, Math.min(100, Math.round(50 + summary.avg_pnl / 4)));

  return [
    {
      id: "edge",
      label: "Edge",
      score: String(edgeScore),
      detail: `Win rate based on ${summary.trades_count} trades.`,
      trendDirection: edgeScore >= 55 ? "up" : "flat"
    },
    {
      id: "risk",
      label: "Risk",
      score: String(riskScore),
      detail: `Profit factor currently at ${formatDecimal(summary.profit_factor)}.`,
      trendDirection: riskScore >= 50 ? "up" : "down"
    },
    {
      id: "discipline",
      label: "Discipline",
      score: String(disciplineScore),
      detail: "Execution consistency derived from risk-adjusted return profile.",
      trendDirection: summary.profit_factor >= 1 ? "up" : "down"
    },
    {
      id: "efficiency",
      label: "Efficiency",
      score: String(efficiencyScore),
      detail: `Average PnL per trade: ${formatDecimal(summary.avg_pnl)}.`,
      trendDirection: summary.avg_pnl >= 0 ? "up" : "down"
    }
  ];
}

function mapInsights(insights: DashboardInsights | null): InsightModel[] {
  if (!insights) return [];
  return insights.top_insights.map((item, index) => ({
    id: `insight-${index}`,
    title: item.title,
    interpretation: item.detail,
    recommendation: `${insights.recommended_action.title}: ${insights.recommended_action.detail}`,
    ctaLabel: "Review action"
  }));
}

function mapTopLeaks(insights: DashboardInsights | null): TopLeakModel[] {
  if (!insights) return [];
  return insights.top_insights.map((item, index) => ({
    id: `leak-${index}`,
    leak: item.title,
    impact: item.severity,
    frequency: "Derived",
    owner: "Strategy",
    status: item.severity.toLowerCase().includes("high") ? "open" : "watch"
  }));
}

export function DashboardV1Screen() {
  const [mode, setMode] = useState<DashboardMode>("simple");
  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
    refresh: refreshSummary
  } = useDashboardSummary();
  const {
    data: insights,
    loading: insightsLoading,
    error: insightsError,
    refresh: refreshInsights
  } = useDashboardInsights();

  useEffect(() => {
    void refreshSummary();
    void refreshInsights();
  }, [refreshInsights, refreshSummary]);

  const breakdownItems = useMemo(() => mapBreakdown(summary), [summary]);
  const insightItems = useMemo(() => mapInsights(insights), [insights]);
  const topLeaksRows = useMemo(() => mapTopLeaks(insights), [insights]);

  const headerSubtitle = summaryError || insightsError
    ? "Some dashboard sections are unavailable right now."
    : "Actionable portfolio diagnostics powered by MT5 analytics.";

  return (
    <section className={styles.page}>
      <DashboardHeader
        title="Performance Intelligence"
        subtitle={headerSubtitle}
        rangeLabel="Last 30 days"
        mode={mode}
        onModeChange={setMode}
      />

      {summaryLoading ? (
        <div className={styles.heroGrid}>
          <Skeleton height={150} />
          <Skeleton height={150} />
          <Skeleton height={150} />
        </div>
      ) : summaryError ? (
        <Text className="ui-text-error">{summaryError}</Text>
      ) : summary ? (
        <HeroCards
          performanceScore={{
            label: "Performance score",
            value: `${Math.round(summary.profit_factor * 40)}`,
            context: `${summary.trades_count} trades analyzed.`,
            tone: summary.profit_factor >= 1 ? "success" : "warning"
          }}
          percentile={{
            label: "Win rate",
            value: formatPercent(summary.winrate),
            context: "Derived from closed trades.",
            tone: summary.winrate >= 0.5 ? "primary" : "warning"
          }}
          consistency={{
            label: "Profit factor",
            value: formatDecimal(summary.profit_factor),
            context: `Avg PnL ${formatDecimal(summary.avg_pnl)}.`,
            tone: summary.profit_factor >= 1 ? "success" : "warning"
          }}
        />
      ) : null}

      {insightsLoading ? (
        <div className={styles.insightsGrid}>
          <Skeleton height={140} />
          <Skeleton height={140} />
        </div>
      ) : insightsError ? (
        <Text className="ui-text-error">{insightsError}</Text>
      ) : (
        <InsightCardsSection items={insightItems} />
      )}

      {mode === "pro" ? (
        <Card>
          <Heading level={3}>Advanced Filters</Heading>
          <Text tone="muted" size="sm" style={{ marginTop: 8 }}>
            Placeholder controls for portfolio, setup class, volatility regime and session clusters.
          </Text>
          <div className={styles.advancedFilters}>
            <span className={styles.filterToken}>Portfolio: Macro FX</span>
            <span className={styles.filterToken}>Setup: Breakout</span>
            <span className={styles.filterToken}>Regime: High Vol</span>
            <span className={styles.filterToken}>Session: London/NY overlap</span>
          </div>
        </Card>
      ) : null}

      {summaryLoading ? (
        <div className={styles.breakdownGrid}>
          <Skeleton height={160} />
          <Skeleton height={160} />
          <Skeleton height={160} />
          <Skeleton height={160} />
        </div>
      ) : summaryError ? (
        <Text className="ui-text-error">{summaryError}</Text>
      ) : (
        <BreakdownSection items={breakdownItems} />
      )}

      {insightsLoading ? (
        <Skeleton height={220} />
      ) : insightsError ? (
        <Text className="ui-text-error">{insightsError}</Text>
      ) : (
        <TopLeaksSection mode={mode} rows={topLeaksRows} />
      )}
    </section>
  );
}
