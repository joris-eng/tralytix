import type { FaqItem, PlanModel } from "@/features/plans/model";

export const plans: PlanModel[] = [
  {
    tier: "discovery",
    name: "Decouverte",
    audience: "Pour debuter avec des signaux clairs et un cadre simple.",
    priceLabel: "Gratuit",
    bullets: [
      "Dashboard simple avec KPIs essentiels",
      "Insights prioritaires et recommandations de base",
      "Suivi des performances hebdomadaires",
      "Export CSV standard"
    ],
    ctaLabel: "Start Discovery",
    ctaHref: "#start-discovery"
  },
  {
    tier: "pro",
    name: "Pro — Mensuel",
    audience: "Pour traders avances qui veulent un drilldown complet.",
    priceLabel: "24,99 €",
    priceSub: "/ mois",
    bullets: [
      "Pro Analysis avec filtres avances multi-segments",
      "Diagnostics de leaks et analyse trade-level",
      "Alertes patterns prioritisees",
      "Workflows d'optimisation et comparatifs de regimes"
    ],
    ctaLabel: "Go Pro Mensuel",
    ctaHref: "#go-pro",
    highlighted: true
  },
  {
    tier: "pro-yearly",
    name: "Pro — Annuel",
    audience: "Meme acces complet, avec 2 mois offerts.",
    priceLabel: "239,99 €",
    priceSub: "/ an  · ~20 €/mois",
    bullets: [
      "Tout le plan Pro Mensuel inclus",
      "2 mois offerts vs. mensuel",
      "Acces prioritaire aux nouvelles fonctionnalites",
      "Support prioritaire"
    ],
    ctaLabel: "Go Pro Annuel",
    ctaHref: "#go-pro-yearly"
  }
];

export const plansFaq: FaqItem[] = [
  {
    id: "faq-1",
    question: "Puis-je changer de plan a tout moment ?",
    answer: "Oui, le passage de Decouverte a Pro est immediat et reversible."
  },
  {
    id: "faq-2",
    question: "Le plan Pro ajoute-t-il des donnees supplementaires ?",
    answer: "Il ajoute surtout plus de profondeur d'analyse et des outils de drilldown."
  },
  {
    id: "faq-3",
    question: "Un moyen de paiement est-il requis pour Decouverte ?",
    answer: "Non, Decouverte est accessible sans paiement."
  },
  {
    id: "faq-4",
    question: "Quelle difference entre mensuel et annuel ?",
    answer: "L'abonnement annuel donne acces aux memes fonctionnalites Pro avec 2 mois offerts, soit ~20 EUR/mois."
  }
];
