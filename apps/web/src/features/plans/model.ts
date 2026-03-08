export type PlanTier = "free" | "pro" | "elite";
export type BillingPeriod = "monthly" | "yearly";

export type PlanPrice = {
  monthly: string;
  yearly: string;
};

export type PlanModel = {
  tier: PlanTier;
  name: string;
  audience: string;
  /** null = free plan (no price) */
  price: PlanPrice | null;
  priceSub: PlanPrice | null;
  monthlyPriceId?: string;
  yearlyPriceId?: string;
  /** Number of free trial days (Pro only) */
  trialDays?: number;
  bullets: string[];
  /** Features listed as "coming soon" (dimmed, badge) */
  comingSoon?: string[];
  ctaLabel: string;
  highlighted?: boolean;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};
