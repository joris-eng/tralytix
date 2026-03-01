import Link from "next/link";
import type { PlanModel } from "@/features/plans/model";
import { FeatureList } from "@/features/plans/ui/FeatureList";
import { Badge, Card, Heading, Text } from "@/features/ui/primitives";
import styles from "@/features/plans/ui/plans.module.css";

type PricingCardProps = {
  plan: PlanModel;
};

export function PricingCard({ plan }: PricingCardProps) {
  return (
    <Card elevated={plan.highlighted} className={styles.pricingCard}>
      {plan.highlighted ? (
        <div className={styles.popularBadge}>
          <Badge variant="primary">Most popular</Badge>
        </div>
      ) : null}

      <div>
        <Heading level={2}>{plan.name}</Heading>
        <Text tone="muted" size="sm" style={{ marginTop: 8 }}>
          {plan.audience}
        </Text>
      </div>

      <div className={styles.priceRow}>
        <Heading level={1}>{plan.priceLabel}</Heading>
      </div>

      <FeatureList items={plan.bullets} />

      <div className={styles.ctaRow}>
        <Link
          href={plan.ctaHref}
          className="ui-button"
          data-variant={plan.tier === "pro" ? "primary" : "neutral"}
          aria-label={plan.ctaLabel}
        >
          {plan.ctaLabel}
        </Link>
      </div>
    </Card>
  );
}
