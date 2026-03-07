export type PlanTier = "discovery" | "pro" | "pro-yearly";

export type PlanModel = {
  tier: PlanTier;
  name: string;
  audience: string;
  priceLabel: string;
  priceSub?: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};
