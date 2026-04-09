export type PlanTier = "free" | "pro" | "elite";
export type BillingPeriod = "monthly" | "yearly";

export type PlanPrice = {
  monthly: string;
  yearly: string;
};

export type PlanFeature = {
  label: string;
  /** true = available (green ✓), false = unavailable (red ✗) */
  available: boolean;
  /** Optional note shown inline e.g. "(1)" or "(illimités)" */
  note?: string;
};

export type PlanModel = {
  tier: PlanTier;
  name: string;
  audience: string;
  price: PlanPrice | null;
  priceSub?: PlanPrice;
  tagline?: string;
  monthlyPriceId?: string;
  yearlyPriceId?: string;
  trialDays?: number;
  features: PlanFeature[];
  ctaLabel: string;
  highlighted?: boolean;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};
