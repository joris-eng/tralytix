import type { BreakdownModel } from "@/features/dashboard/model";
import { Card, Heading, Text } from "@/features/ui/primitives";
import { SparklinePlaceholder } from "@/features/dashboard/ui/SparklinePlaceholder";
import styles from "@/features/dashboard/ui/dashboardV1.module.css";

function mapTrendLabel(direction: BreakdownModel["trendDirection"]): string {
  if (direction === "up") return "Uptrend";
  if (direction === "down") return "Downtrend";
  return "Stable";
}

type BreakdownCardProps = {
  item: BreakdownModel;
};

function BreakdownCard({ item }: BreakdownCardProps) {
  return (
    <Card>
      <div className={styles.cardHeader}>
        <Heading level={3}>{item.label}</Heading>
        <div className={styles.trendIndicator}>
          <span className={styles.trendDot} data-trend={item.trendDirection} />
          <span className={styles.trendText}>{mapTrendLabel(item.trendDirection)}</span>
        </div>
      </div>
      <div className={styles.breakdownScore}>{item.score}</div>
      <Text tone="muted" size="sm">
        {item.detail}
      </Text>
      <SparklinePlaceholder />
    </Card>
  );
}

type BreakdownSectionProps = {
  items: BreakdownModel[];
};

export function BreakdownSection({ items }: BreakdownSectionProps) {
  return (
    <section className={styles.sectionBlock}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionEyebrow}>Score decomposition</span>
        <Heading level={2} className={styles.sectionTitle}>
          Breakdown
        </Heading>
      </div>
      <div className={styles.breakdownGrid}>
        {items.map((item) => (
          <BreakdownCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
