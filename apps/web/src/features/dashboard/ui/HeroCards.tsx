import type { HeroMetric } from "@/features/dashboard/model";
import { Badge, Card, Heading, Text } from "@/features/ui/primitives";
import styles from "@/features/dashboard/ui/dashboardV1.module.css";

type HeroMetricCardProps = {
  metric: HeroMetric;
};

function HeroMetricCard({ metric }: HeroMetricCardProps) {
  return (
    <Card>
      <div className={styles.cardHeader}>
        <Heading level={3}>{metric.label}</Heading>
        <Badge variant={metric.tone}>{metric.tone.toUpperCase()}</Badge>
      </div>
      <Heading level={1} className={styles.metricValue}>
        {metric.value}
      </Heading>
      <Text tone="muted" size="sm">
        {metric.context}
      </Text>
    </Card>
  );
}

type HeroCardsProps = {
  performanceScore: HeroMetric;
  percentile: HeroMetric;
  consistency: HeroMetric;
};

export function HeroCards({ performanceScore, percentile, consistency }: HeroCardsProps) {
  return (
    <section className={styles.heroGrid}>
      <HeroMetricCard metric={performanceScore} />
      <HeroMetricCard metric={percentile} />
      <HeroMetricCard metric={consistency} />
    </section>
  );
}
