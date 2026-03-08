import type { FaqItem, PlanModel } from "@/features/plans/model";

export const plans: PlanModel[] = [
  {
    tier: "free",
    name: "Découverte",
    audience: "Pour débuter avec des signaux clairs et un cadre simple.",
    price: null,
    priceSub: null,
    bullets: [
      "Dashboard KPIs basiques",
      "1 import MT5 CSV",
      "Insights de base",
      "Accès limité aux analyses"
    ],
    ctaLabel: "Plan actuel"
  },
  {
    tier: "pro",
    name: "Pro",
    audience: "Pour traders avancés qui veulent un drilldown complet.",
    price: { monthly: "24,99 €", yearly: "239,99 €" },
    priceSub: { monthly: "/ mois", yearly: "/ an  ·  ~20 €/mois" },
    monthlyPriceId: "price_1T8ceVAufOS3IvBw2gPL3TYj",
    yearlyPriceId:  "price_1T8cgPAufOS3IvBw7nsJYPAw",
    trialDays: 10,
    bullets: [
      "Pro Analysis avec filtres avancés multi-segments",
      "Diagnostics de leaks et analyse trade-level",
      "Equity curve complète",
      "Imports MT5 illimités",
      "Export CSV"
    ],
    ctaLabel: "Go Pro",
    highlighted: true
  },
  {
    tier: "elite",
    name: "Elite",
    audience: "Pour les traders qui veulent le niveau professionnel complet.",
    price: { monthly: "49,99 €", yearly: "479,99 €" },
    priceSub: { monthly: "/ mois", yearly: "/ an  ·  ~40 €/mois" },
    monthlyPriceId: "price_1T8clZAufOS3IvBw4Swgd1WE",
    yearlyPriceId:  "price_1T8cmfAufOS3IvBwiHUL5Yes",
    bullets: [
      "Tout le plan Pro inclus",
      "Support prioritaire"
    ],
    comingSoon: [
      "Alertes performance en temps réel",
      "Journal de trading intelligent",
      "Comparatif de régimes de marché",
      "Connexion directe MT5 (live)"
    ],
    ctaLabel: "Go Elite"
  }
];

export const plansFaq: FaqItem[] = [
  {
    id: "faq-1",
    question: "Puis-je changer de plan à tout moment ?",
    answer: "Oui, le passage entre plans est immédiat et réversible depuis le portail Stripe."
  },
  {
    id: "faq-2",
    question: "L'essai Pro est-il gratuit ?",
    answer: "Oui, le plan Pro inclut 10 jours d'essai gratuit sans carte de crédit requise."
  },
  {
    id: "faq-3",
    question: "Un moyen de paiement est-il requis pour Découverte ?",
    answer: "Non, Découverte est accessible sans paiement ni carte."
  },
  {
    id: "faq-4",
    question: "Quelle différence entre mensuel et annuel ?",
    answer: "L'abonnement annuel Pro est ~20 €/mois (vs 24,99 €), Elite ~40 €/mois (vs 49,99 €) — soit 2 mois offerts."
  }
];
