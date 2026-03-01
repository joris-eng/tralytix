import type { InsightModel } from "@/features/dashboard/model";
import { Button, Card, Divider, Heading, Text } from "@/features/ui/primitives";
import styles from "@/features/dashboard/ui/dashboardV1.module.css";

type InsightCardProps = {
  item: InsightModel;
};

function InsightCard({ item }: InsightCardProps) {
  return (
    <Card>
      <Heading level={3}>{item.title}</Heading>
      <Text tone="muted" size="sm" style={{ marginTop: 8 }}>
        {item.interpretation}
      </Text>
      <Divider style={{ margin: "12px 0" }} />
      <Text size="sm">{item.recommendation}</Text>
      <div className={styles.insightFooter}>
        <Button variant="primary">{item.ctaLabel}</Button>
      </div>
    </Card>
  );
}

type InsightCardsSectionProps = {
  items: InsightModel[];
};

export function InsightCardsSection({ items }: InsightCardsSectionProps) {
  return (
    <section>
      <Heading level={2}>Insights</Heading>
      <div className={styles.insightsGrid} style={{ marginTop: 12 }}>
        {items.map((item) => (
          <InsightCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
