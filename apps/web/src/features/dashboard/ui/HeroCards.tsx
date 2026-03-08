import type { HeroMetric, HeroCardTone } from "@/features/dashboard/model";
import styles from "@/features/dashboard/ui/heroCards.module.css";

function toneToAccent(tone: HeroCardTone): string {
  switch (tone) {
    case "success": return "var(--ui-color-success)";
    case "warning": return "var(--ui-color-warning)";
    case "primary": return "var(--ui-color-primary)";
    default:        return "var(--ui-color-text)";
  }
}

type HeroMetricCardProps = {
  metric: HeroMetric;
};

function HeroMetricCard({ metric }: HeroMetricCardProps) {
  const accent = toneToAccent(metric.tone);

  return (
    <div
      className={styles.card}
      style={{ "--card-accent": accent } as React.CSSProperties}
    >
      <div className={styles.cardTop}>
        <span className={styles.label}>{metric.label}</span>
        <span className={styles.dot} style={{ background: accent }} />
      </div>
      <div className={styles.value} style={{ color: accent }}>
        {metric.value}
      </div>
      <div className={styles.context}>{metric.context}</div>
    </div>
  );
}

type HeroCardsProps = {
  performanceScore: HeroMetric;
  winRate: HeroMetric;
  profitFactor: HeroMetric;
  totalProfit: HeroMetric;
};

export function HeroCards({ performanceScore, winRate, profitFactor, totalProfit }: HeroCardsProps) {
  return (
    <section className={styles.grid}>
      <HeroMetricCard metric={performanceScore} />
      <HeroMetricCard metric={winRate} />
      <HeroMetricCard metric={profitFactor} />
      <HeroMetricCard metric={totalProfit} />
    </section>
  );
}
