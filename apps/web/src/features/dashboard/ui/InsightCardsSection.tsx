import type { InsightModel } from "@/features/dashboard/model";
import { Button, Heading, Text } from "@/features/ui/primitives";
import styles from "@/features/dashboard/ui/dashboardV1.module.css";

function severityDotColor(severity?: string): string {
  if (!severity) return "var(--ui-color-text-subtle)";
  const lower = severity.toLowerCase();
  if (lower.includes("high")) return "var(--ui-color-danger)";
  if (lower.includes("med")) return "var(--ui-color-warning)";
  return "var(--ui-color-success)";
}

type InsightCardProps = {
  item: InsightModel;
};

function InsightCard({ item }: InsightCardProps) {
  const dotColor = severityDotColor(item.severity);
  return (
    <div className={styles.insightCard}>
      <div className={styles.insightHeader}>
        <span className={styles.severityDot} style={{ background: dotColor }} />
        <Heading level={3} style={{ margin: 0 }}>{item.title}</Heading>
      </div>
      <Text tone="muted" size="sm" style={{ marginTop: 8 }}>
        {item.interpretation}
      </Text>
      <div className={styles.insightFooter}>
        <Button variant="primary">{item.ctaLabel}</Button>
      </div>
    </div>
  );
}

type InsightCardsSectionProps = {
  items: InsightModel[];
};

export function InsightCardsSection({ items }: InsightCardsSectionProps) {
  return (
    <section className={styles.sectionBlock}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionEyebrow}>AI insight layer</span>
        <Heading level={2} className={styles.sectionTitle}>
          Insights
        </Heading>
      </div>
      <div className={styles.insightsGrid}>
        {items.map((item) => (
          <InsightCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
