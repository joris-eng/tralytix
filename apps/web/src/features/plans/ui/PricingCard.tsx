import type { BillingPeriod, PlanModel } from "@/features/plans/model";
import { FeatureList } from "@/features/plans/ui/FeatureList";
import { Badge, Button, Card, Heading, Text } from "@/features/ui/primitives";
import styles from "@/features/plans/ui/plans.module.css";

type PricingCardProps = {
  plan: PlanModel;
  billingPeriod: BillingPeriod;
  current?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onAction?: () => void;
};

export function PricingCard({
  plan,
  billingPeriod,
  current = false,
  loading = false,
  disabled = false,
  onAction,
}: PricingCardProps) {
  const priceLabel = plan.price ? plan.price[billingPeriod] : "Gratuit";
  const priceSub = plan.priceSub ? plan.priceSub[billingPeriod] : null;
  const isFree = plan.tier === "free";

  return (
    <Card elevated={plan.highlighted} className={styles.pricingCard}>
      {plan.highlighted ? (
        <div className={styles.popularBadge}>
          <Badge variant="primary">Le plus populaire</Badge>
        </div>
      ) : null}

      {current ? (
        <div className={styles.currentBadge}>
          <Badge variant="success">Plan actuel</Badge>
        </div>
      ) : null}

      {plan.trialDays && !isFree ? (
        <div className={styles.trialBadge}>
          <Badge variant="warning">{plan.trialDays} jours d&apos;essai gratuit</Badge>
        </div>
      ) : null}

      <div>
        <Heading level={2}>{plan.name}</Heading>
        <Text tone="muted" size="sm" style={{ marginTop: 8 }}>
          {plan.audience}
        </Text>
      </div>

      <div className={styles.priceRow}>
        <Heading level={1}>{priceLabel}</Heading>
        {priceSub ? (
          <Text tone="muted" size="sm" style={{ marginTop: 2 }}>
            {priceSub}
          </Text>
        ) : null}
      </div>

      <FeatureList items={plan.bullets} />

      {plan.comingSoon && plan.comingSoon.length > 0 ? (
        <div className={styles.comingSoonSection}>
          <Text tone="muted" size="sm" style={{ marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Prochainement
          </Text>
          <ul className={styles.comingSoonList}>
            {plan.comingSoon.map((feature) => (
              <li key={feature} className={styles.comingSoonItem}>
                <span className={styles.comingSoonDot} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.ctaRow}>
        {isFree ? (
          current ? (
            <Button variant="neutral" disabled aria-label="Plan actuel">
              Plan actuel
            </Button>
          ) : null
        ) : (
          <Button
            variant={plan.highlighted ? "primary" : "neutral"}
            aria-label={plan.ctaLabel}
            onClick={onAction}
            disabled={disabled || loading}
          >
            {loading ? "Redirection…" : current ? "Plan actuel" : plan.ctaLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
