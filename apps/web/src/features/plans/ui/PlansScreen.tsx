"use client";

import { useState } from "react";
import { apiClient } from "@/shared/api/apiClient";
import { usePlan } from "@/shared/auth/useSessionState";
import { plans, plansFaq } from "@/features/plans/data";
import type { PlanTier } from "@/features/plans/model";
import { PricingCard } from "@/features/plans/ui/PricingCard";
import { Card, Divider, Heading, Text } from "@/features/ui/primitives";
import styles from "@/features/plans/ui/plans.module.css";

const STRIPE_PRICE_MONTHLY =
  (process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY ?? "").trim() ||
  "price_1T6GddAufOS3IvBwBKmRv2g0";

const STRIPE_PRICE_YEARLY =
  (process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY ?? "").trim() ||
  "price_1T6GddAufOS3IvBw0KLTIECP";

const PRICE_BY_TIER: Partial<Record<PlanTier, string>> = {
  "pro":        STRIPE_PRICE_MONTHLY,
  "pro-yearly": STRIPE_PRICE_YEARLY,
};

export function PlansScreen() {
  const plan = usePlan();
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(tier: PlanTier) {
    setError(null);

    if (tier === "discovery") return;
    if (plan === "pro") return;

    const priceId = PRICE_BY_TIER[tier];
    console.log("[plans] handleCheckout tier=%s priceId=%s", tier, priceId);

    if (!priceId) {
      setError("Missing Stripe price ID for this plan.");
      return;
    }

    try {
      setLoadingTier(tier);
      console.log("[plans] calling billingCheckout with priceId=%s", priceId);
      const payload = await apiClient.billingCheckout(priceId);
      console.log("[plans] checkout response:", payload);
      if (!payload.checkout_url) {
        setError("Checkout URL missing from billing response.");
        return;
      }
      window.location.href = payload.checkout_url;
    } catch (err) {
      console.error("[plans] checkout error:", err);
      setError(err instanceof Error ? err.message : "Unable to start checkout. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <Heading level={1}>Plans</Heading>
        <Text tone="muted">Choisis une experience adaptee a ton niveau, sans complexite inutile.</Text>
      </header>

      <section className={styles.comparisonGrid} aria-label="Plan comparison">
        {plans.map((item) => (
          <PricingCard
            key={item.tier}
            plan={item}
            current={
              (plan === "free" && item.tier === "discovery") ||
              (plan === "pro" && (item.tier === "pro" || item.tier === "pro-yearly"))
            }
            loading={loadingTier === item.tier}
            disabled={(item.tier === "pro" || item.tier === "pro-yearly") && plan === "pro"}
            onAction={() => void handleCheckout(item.tier)}
          />
        ))}
      </section>

      {error ? (
        <Text className="ui-text-error" size="sm">
          {error}
        </Text>
      ) : null}

      <Card>
        <Heading level={2}>FAQ</Heading>
        <div className={styles.faqList} style={{ marginTop: 12 }}>
          {plansFaq.map((item, index) => (
            <div key={item.id} className={styles.faqItem}>
              <Heading level={3}>{item.question}</Heading>
              <Text tone="muted" size="sm">
                {item.answer}
              </Text>
              {index < plansFaq.length - 1 ? <Divider style={{ marginTop: 8 }} /> : null}
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
