"use client";

import { useState } from "react";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { apiClient } from "@/shared/api/apiClient";
import { plans, plansFaq } from "@/features/plans/data";
import type { BillingPeriod, PlanTier } from "@/features/plans/model";
import { PricingCard } from "@/features/plans/ui/PricingCard";
import styles from "@/features/plans/ui/plans.module.css";

export default function PlansScreen2() {
  const { t } = useLanguage();
  const [currentPlan] = useState<PlanTier>("free");
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  void t;

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
        setError(
          err instanceof Error ? err.message : "Impossible de démarrer le paiement. Réessaie."
        );
      }
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Plans</h1>
        <p className={styles.pageSubtitle}>Choisissez une expérience adaptée à votre niveau.</p>
      </header>

      {/* Billing toggle */}
      <div className={styles.billingToggleWrap}>
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
      </div>

      {/* Pricing cards */}
      <div className={styles.grid}>
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
      </div>

      {/* Error */}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {/* FAQ */}
      <section className={styles.faqSection}>
        <h2 className={styles.faqTitle}>Questions fréquentes</h2>
        <div className={styles.faqList}>
          {plansFaq.map((item) => (
            <div
              key={item.id}
              className={[styles.faqItem, openFaq === item.id ? styles.faqItemOpen : ""]
                .filter(Boolean)
                .join(" ")}
            >
              <button
                type="button"
                className={styles.faqQuestion}
                onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                aria-expanded={openFaq === item.id}
              >
                <span>{item.question}</span>
                <span className={styles.faqChevron}>{openFaq === item.id ? "−" : "+"}</span>
              </button>
              {openFaq === item.id && <p className={styles.faqAnswer}>{item.answer}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
