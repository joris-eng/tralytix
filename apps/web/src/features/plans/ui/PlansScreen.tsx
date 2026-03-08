"use client";

import { useState } from "react";
import { apiClient } from "@/shared/api/apiClient";
import { usePlan } from "@/shared/auth/useSessionState";
import { plans, plansFaq } from "@/features/plans/data";
import type { BillingPeriod, PlanTier } from "@/features/plans/model";
import { PricingCard } from "@/features/plans/ui/PricingCard";
import { Card, Divider, Heading, Text } from "@/features/ui/primitives";
import styles from "@/features/plans/ui/plans.module.css";

export function PlansScreen() {
  const currentPlan = usePlan();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(tier: PlanTier) {
    setError(null);
    if (tier === "free") return;

    const planData = plans.find((p) => p.tier === tier);
    if (!planData) return;

    const priceId =
      billingPeriod === "yearly"
        ? planData.yearlyPriceId
        : planData.monthlyPriceId;

    console.log("[plans] handleCheckout tier=%s period=%s priceId=%s", tier, billingPeriod, priceId);

    if (!priceId) {
      setError(`Missing Stripe price ID for ${tier} plan.`);
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
        <Text tone="muted">Choisissez une expérience adaptée à votre niveau.</Text>
      </header>

      {/* Billing period toggle */}
      <div className={styles.billingToggle}>
        <button
          type="button"
          className={billingPeriod === "monthly" ? styles.toggleActive : styles.toggleInactive}
          onClick={() => setBillingPeriod("monthly")}
        >
          Mensuel
        </button>
        <button
          type="button"
          className={billingPeriod === "yearly" ? styles.toggleActive : styles.toggleInactive}
          onClick={() => setBillingPeriod("yearly")}
        >
          Annuel <span className={styles.savingsBadge}>2 mois offerts</span>
        </button>
      </div>

      <section className={styles.comparisonGrid} aria-label="Plan comparison">
        {plans.map((item) => (
          <PricingCard
            key={item.tier}
            plan={item}
            billingPeriod={billingPeriod}
            current={currentPlan === item.tier || (currentPlan === "free" && item.tier === "free")}
            loading={loadingTier === item.tier}
            disabled={item.tier !== "free" && currentPlan === item.tier}
            onAction={() => void handleCheckout(item.tier)}
          />
        ))}
      </section>

      {error ? (
        <Text className="ui-text-error" size="sm" style={{ textAlign: "center", marginTop: 16 }}>
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
