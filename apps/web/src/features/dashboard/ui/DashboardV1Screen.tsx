"use client";

import { useState } from "react";
import { dashboardViewModelMock } from "@/features/dashboard/mock";
import type { DashboardMode } from "@/features/dashboard/model";
import { BreakdownSection } from "@/features/dashboard/ui/BreakdownSection";
import { DashboardHeader } from "@/features/dashboard/ui/DashboardHeader";
import { HeroCards } from "@/features/dashboard/ui/HeroCards";
import { InsightCardsSection } from "@/features/dashboard/ui/InsightCardsSection";
import { TopLeaksSection } from "@/features/dashboard/ui/TopLeaksSection";
import { Card, Heading, Text } from "@/features/ui/primitives";
import styles from "@/features/dashboard/ui/dashboardV1.module.css";

export function DashboardV1Screen() {
  const [mode, setMode] = useState<DashboardMode>("simple");
  const viewModel = dashboardViewModelMock;

  return (
    <section className={styles.page}>
      <DashboardHeader
        title={viewModel.title}
        subtitle={viewModel.subtitle}
        rangeLabel={viewModel.rangeLabel}
        mode={mode}
        onModeChange={setMode}
      />

      <HeroCards
        performanceScore={viewModel.hero.performanceScore}
        percentile={viewModel.hero.percentile}
        consistency={viewModel.hero.consistency}
      />

      <InsightCardsSection items={viewModel.insights} />

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

      <BreakdownSection items={viewModel.breakdown} />
      <TopLeaksSection mode={mode} rows={viewModel.topLeaks} />
    </section>
  );
}
