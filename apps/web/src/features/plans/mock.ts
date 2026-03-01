import type { FaqItem, PlanModel } from "@/features/plans/model";

export const plansMock: PlanModel[] = [
  {
    tier: "discovery",
    name: "Decouverte",
    audience: "Pour debuter avec des signaux clairs et un cadre simple.",
    priceLabel: "Free",
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
    name: "Pro",
    audience: "Pour traders avances qui veulent un drilldown complet.",
    priceLabel: "49 EUR / mois",
    bullets: [
      "Pro Analysis avec filtres avances multi-segments",
      "Diagnostics de leaks et analyse trade-level",
      "Alertes patterns prioritisees",
      "Workflows d'optimisation et comparatifs de regimes"
    ],
    ctaLabel: "Go Pro",
    ctaHref: "#go-pro",
    highlighted: true
  }
];

export const plansFaqMock: FaqItem[] = [
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
  }
];
