import type { BillingPeriod, PlanModel } from "@/features/plans/model";
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
  const priceLabel = plan.price ? plan.price[billingPeriod] : null;
  const priceSub = plan.priceSub ? plan.priceSub[billingPeriod] : null;
  const isFree = plan.tier === "free";

  const cardClass = [
    styles.pricingCard,
    plan.highlighted ? styles.pricingCardHighlighted : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClass}>
      {/* ── Header: name + badges ── */}
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleGroup}>
          <span className={styles.cardName}>{plan.name}</span>
          <span className={styles.cardAudience}>{plan.audience}</span>
        </div>
        <div className={styles.badgeGroup}>
          {plan.highlighted && (
            <span className={`${styles.badge} ${styles.badgePopular}`}>
              Le plus populaire
            </span>
          )}
          {current && (
            <span className={`${styles.badge} ${styles.badgeCurrent}`}>
              Plan actuel
            </span>
          )}
          {plan.trialDays && !isFree && !current && (
            <span className={`${styles.badge} ${styles.badgeTrial}`}>
              {plan.trialDays}j gratuits
            </span>
          )}
        </div>
      </div>

      {/* ── Price ── */}
      <div className={styles.priceRow}>
        {isFree ? (
          <span className={styles.priceFree}>Gratuit</span>
        ) : (
          <span className={styles.priceValue}>{priceLabel}</span>
        )}
        {priceSub && <span className={styles.priceSub}>{priceSub}</span>}
      </div>

      {/* ── Features ── */}
      <ul className={styles.featureList}>
        {plan.bullets.map((item) => (
          <li key={item} className={styles.featureItem}>
            <span className={styles.featureCheck}>✓</span>
            {item}
          </li>
        ))}
      </ul>

      {/* ── Coming soon ── */}
      {plan.comingSoon && plan.comingSoon.length > 0 && (
        <div className={styles.comingSoonSection}>
          <div className={styles.comingSoonLabel}>Prochainement</div>
          <ul className={styles.comingSoonList}>
            {plan.comingSoon.map((feature) => (
              <li key={feature} className={styles.comingSoonItem}>
                <span className={styles.comingSoonDot} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── CTA ── */}
      <div className={styles.ctaRow}>
        {isFree ? (
          current ? (
            <div className={styles.ctaCurrent}>Plan actuel</div>
          ) : null
        ) : current ? (
          <div className={styles.ctaCurrent}>Plan actuel</div>
        ) : (
          <button
            type="button"
            className={`${styles.ctaButton} ${
              plan.highlighted ? styles.ctaButtonPrimary : styles.ctaButtonGhost
            }`}
            onClick={onAction}
            disabled={disabled || loading}
          >
            {loading ? "Redirection…" : plan.ctaLabel}
          </button>
        )}
      </div>
    </article>
  );
}
