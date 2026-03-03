import type { PlanModel } from "@/features/plans/model";
import { FeatureList } from "@/features/plans/ui/FeatureList";
import { Badge, Button, Card, Heading, Text } from "@/features/ui/primitives";
import styles from "@/features/plans/ui/plans.module.css";

type PricingCardProps = {
  plan: PlanModel;
  current?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onAction?: () => void;
};

export function PricingCard({ plan, current = false, loading = false, disabled = false, onAction }: PricingCardProps) {
  return (
    <Card elevated={plan.highlighted} className={styles.pricingCard}>
      {plan.highlighted ? (
        <div className={styles.popularBadge}>
          <Badge variant="primary">Most popular</Badge>
        </div>
      ) : null}
      {current ? (
        <div className={styles.popularBadge} style={{ top: 48 }}>
          <Badge variant="success">Current Plan</Badge>
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
        <Button
          variant={plan.tier === "pro" ? "primary" : "neutral"}
          aria-label={plan.ctaLabel}
          onClick={onAction}
          disabled={disabled || loading}
        >
          {loading ? "Redirecting..." : current ? "Current Plan" : plan.ctaLabel}
        </Button>
      </div>
    </Card>
  );
}
