import type { BreakdownModel } from "@/features/dashboard/model";
import { Badge, Card, Heading, Text } from "@/features/ui/primitives";
import { SparklinePlaceholder } from "@/features/dashboard/ui/SparklinePlaceholder";
import styles from "@/features/dashboard/ui/dashboardV1.module.css";

function mapTrendToBadgeVariant(direction: BreakdownModel["trendDirection"]): "neutral" | "primary" | "warning" | "success" {
  if (direction === "up") {
    return "success";
  }
  if (direction === "down") {
    return "warning";
  }
  return "neutral";
}

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
        <Badge variant={mapTrendToBadgeVariant(item.trendDirection)}>{mapTrendLabel(item.trendDirection)}</Badge>
      </div>
      <Heading level={2} className={styles.metricValue}>
        {item.score}
      </Heading>
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
    <section>
      <Heading level={2}>Breakdown</Heading>
      <div className={styles.breakdownGrid} style={{ marginTop: 12 }}>
        {items.map((item) => (
          <BreakdownCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
