"use client";

import { useMemo, useState } from "react";
import { apiClient } from "@/shared/api/apiClient";
import { usePlan } from "@/shared/auth/useSessionState";
import { plans, plansFaq } from "@/features/plans/data";
import { PricingCard } from "@/features/plans/ui/PricingCard";
import { Card, Divider, Heading, Text } from "@/features/ui/primitives";
import styles from "@/features/plans/ui/plans.module.css";

export function PlansScreen() {
  const plan = usePlan();
  const [loadingTier, setLoadingTier] = useState<"discovery" | "pro" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pricesByTier = useMemo(
    () => ({
      discovery: "",
      pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY ?? ""
    }),
    []
  );

  async function handleCheckout(tier: "discovery" | "pro") {
    setError(null);
    if (tier !== "pro") {
      return;
    }
    if (plan === "pro") {
      return;
    }
    const priceId = pricesByTier[tier];
    if (!priceId) {
      setError("Missing Stripe price ID for Pro plan.");
      return;
    }
    try {
      setLoadingTier(tier);
      const payload = await apiClient.billingCheckout(priceId);
      if (!payload.checkout_url) {
        setError("Checkout URL missing from billing response.");
        return;
      }
      window.location.href = payload.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout");
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
            current={(plan === "free" && item.tier === "discovery") || (plan === "pro" && item.tier === "pro")}
            loading={loadingTier === item.tier}
            disabled={item.tier === "pro" && plan === "pro"}
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
