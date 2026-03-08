"use client";

import { useState } from "react";
import { apiClient } from "@/shared/api/apiClient";
import { usePlan } from "@/shared/auth/useSessionState";
import { plans, plansFaq } from "@/features/plans/data";
import type { BillingPeriod, PlanTier } from "@/features/plans/model";
import { PricingCard } from "@/features/plans/ui/PricingCard";
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
      billingPeriod === "yearly" ? planData.yearlyPriceId : planData.monthlyPriceId;

    if (!priceId) {
      setError(`Missing Stripe price ID for ${tier} plan.`);
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
      const isAbort =
        (err instanceof DOMException && err.name === "AbortError") ||
        (err instanceof Error && err.name === "AbortError");
      if (isAbort) {
        setError("La connexion a pris trop de temps. Réessaie dans quelques secondes.");
      } else {
        setError(err instanceof Error ? err.message : "Impossible de démarrer le paiement. Réessaie.");
      }
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <section className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Plans</h1>
        <p className={styles.headerSub}>
          Choisissez une expérience adaptée à votre niveau.
        </p>
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
          Annuel
          <span className={styles.savingsBadge}>2 mois offerts</span>
        </button>
      </div>

      {/* Cards */}
      <section className={styles.comparisonGrid} aria-label="Comparaison des plans">
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

      {/* Error */}
      {error ? (
        <p style={{
          textAlign: "center",
          fontFamily: "var(--ui-font-mono)",
          fontSize: "var(--ui-font-size-sm)",
          color: "var(--ui-color-danger)",
          marginTop: 0,
        }}>
          {error}
        </p>
      ) : null}

      {/* FAQ */}
      <div className={styles.faqSection}>
        <div className={styles.faqTitle}>Questions fréquentes</div>
        <div className={styles.faqList}>
          {plansFaq.map((item) => (
            <div key={item.id} className={styles.faqItem}>
              <div className={styles.faqQuestion}>{item.question}</div>
              <div className={styles.faqAnswer}>{item.answer}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
