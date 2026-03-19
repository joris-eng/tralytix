"use client";

import type { BillingPeriod, PlanModel } from "@/features/plans/model";
import styles from "@/features/plans/ui/plans.module.css";

type Props = {
  plan: PlanModel;
  billingPeriod: BillingPeriod;
  current: boolean;
  loading: boolean;
  disabled: boolean;
  onAction: () => void;
};

export function PricingCard({
  plan,
  billingPeriod,
  current,
  loading,
  disabled,
  onAction,
}: Props) {
  const price = plan.price
    ? billingPeriod === "yearly"
      ? plan.price.yearly
      : plan.price.monthly
    : null;

  const priceSub = plan.priceSub
    ? billingPeriod === "yearly"
      ? plan.priceSub.yearly
      : plan.priceSub.monthly
    : null;

  const isFree = plan.tier === "free";
  const isHighlighted = plan.highlighted;

  return (
    <div
      className={[
        styles.card,
        isHighlighted ? styles.cardHighlighted : "",
        current ? styles.cardCurrent : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Top badges row */}
      <div className={styles.badgeRow}>
        {plan.highlighted && (
          <span className={styles.badgePopular}>✦ Le plus populaire</span>
        )}
        {plan.trialDays && (
          <span className={styles.badgeTrial}>{plan.trialDays}j gratuits</span>
        )}
        {current && plan.tier !== "free" && (
          <span className={styles.badgeCurrent}>Plan actuel</span>
        )}
        {current && plan.tier === "free" && (
          <span className={styles.badgeCurrent}>Plan actuel</span>
        )}
      </div>

      {/* Plan name + description */}
      <h2 className={styles.planName}>{plan.name}</h2>
      <p className={styles.planAudience}>{plan.audience}</p>

      {/* Price */}
      <div className={styles.priceBlock}>
        {isFree ? (
          <span className={styles.priceFree}>Gratuit</span>
        ) : (
          <>
            <span className={styles.priceAmount}>{price}</span>
            {priceSub && <span className={styles.pricePeriod}> {priceSub}</span>}
          </>
        )}
      </div>

      {/* Tagline */}
      {plan.tagline && <p className={styles.tagline}>{plan.tagline}</p>}

      {/* Feature list */}
      <ul className={styles.featureList}>
        {plan.features.map((feat) => (
          <li
            key={feat.label}
            className={feat.available ? styles.featAvailable : styles.featUnavailable}
          >
            <span className={styles.featIcon}>{feat.available ? "✓" : "✕"}</span>
            <span className={styles.featLabel}>
              {feat.label}
              {feat.note && (
                <span
                  className={
                    feat.available && feat.note !== "(1)"
                      ? styles.featNoteCyan
                      : styles.featNote
                  }
                >
                  {" "}
                  {feat.note}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <button
        type="button"
        className={[
          styles.ctaBtn,
          isHighlighted && !current ? styles.ctaBtnPrimary : styles.ctaBtnGhost,
          current && !isFree ? styles.ctaBtnCurrentPlan : "",
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled || loading}
        onClick={onAction}
      >
        {loading ? "Chargement…" : current && !isFree ? "Plan actuel" : plan.ctaLabel}
      </button>
    </div>
  );
}
