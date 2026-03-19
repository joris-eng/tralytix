import type { FaqItem, PlanModel } from "@/features/plans/model";

// All features in display order — presence in each plan defined below
const ALL_FEATURES = [
  "Dashboard KPIs basiques",
  "Dashboard KPIs complets",
  "AI-powered performance insights",
  "Equity curve",
  "Advanced trade drilldown analysis",
  "Export CSV",
  "Export Monthly Report (PDF)",
  "Imports MT5",
  "Support standard",
  "Support prioritaire",
  "Alertes performance",
  "Journal de trading",
  "Benchmark against other traders",
  "Connexion directe MT5 (EA)",
] as const;

type Feature = (typeof ALL_FEATURES)[number];

function f(label: Feature, available: boolean, note?: string) {
  return { label, available, note };
}

export const plans: PlanModel[] = [
  {
    tier: "free",
    name: "Découverte",
    audience: "Pour débuter avec des signaux clairs et un cadre simple.",
    price: null,
    features: [
      f("Dashboard KPIs basiques", true),
      f("Dashboard KPIs complets", false),
      f("AI-powered performance insights", false),
      f("Equity curve", false),
      f("Advanced trade drilldown analysis", false),
      f("Export CSV", false),
      f("Export Monthly Report (PDF)", false),
      f("Imports MT5", true, "(1)"),
      f("Support standard", false),
      f("Support prioritaire", false),
      f("Alertes performance", false),
      f("Journal de trading", false),
      f("Benchmark against other traders", false),
      f("Connexion directe MT5 (EA)", false),
    ],
    ctaLabel: "Commencer",
  },
  {
    tier: "pro",
    name: "Pro",
    audience: "Pour traders avancés qui veulent un drilldown complet.",
    price: { monthly: "24,99 €", yearly: "249,90 €" },
    priceSub: { monthly: "/ mois", yearly: "/ an" },
    tagline: "Choisi par 80% des utilisateurs actifs",
    monthlyPriceId: "price_1T8ceVAufOS3IvBw2gPL3TYj",
    yearlyPriceId: "price_1T8cgPAufOS3IvBw7nsJYPAw",
    trialDays: 10,
    features: [
      f("Dashboard KPIs basiques", false),
      f("Dashboard KPIs complets", true),
      f("AI-powered performance insights", true),
      f("Equity curve", true),
      f("Advanced trade drilldown analysis", true),
      f("Export CSV", true),
      f("Export Monthly Report (PDF)", false),
      f("Imports MT5", true, "(illimités)"),
      f("Support standard", true),
      f("Support prioritaire", false),
      f("Alertes performance", false),
      f("Journal de trading", false),
      f("Benchmark against other traders", false),
      f("Connexion directe MT5 (EA)", false),
    ],
    ctaLabel: "Go Pro",
    highlighted: true,
  },
  {
    tier: "elite",
    name: "Elite",
    audience: "Pour les traders qui veulent le niveau professionnel complet.",
    price: { monthly: "49,99 €", yearly: "499,90 €" },
    priceSub: { monthly: "/ mois", yearly: "/ an" },
    monthlyPriceId: "price_1T8clZAufOS3IvBw4Swgd1WE",
    yearlyPriceId: "price_1T8cmfAufOS3IvBwiHUL5Yes",
    features: [
      f("Dashboard KPIs basiques", false),
      f("Dashboard KPIs complets", true),
      f("AI-powered performance insights", true),
      f("Equity curve", true),
      f("Advanced trade drilldown analysis", true),
      f("Export CSV", true),
      f("Export Monthly Report (PDF)", true),
      f("Imports MT5", true, "(illimités)"),
      f("Support standard", false),
      f("Support prioritaire", true),
      f("Alertes performance", true),
      f("Journal de trading", true),
      f("Benchmark against other traders", true),
      f("Connexion directe MT5 (EA)", true),
    ],
    ctaLabel: "Go Elite",
  },
];

export const plansFaq: FaqItem[] = [
  {
    id: "faq-1",
    question: "Puis-je changer de plan à tout moment ?",
    answer:
      "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement.",
  },
  {
    id: "faq-2",
    question: "Comment fonctionne l'essai gratuit ?",
    answer:
      "Le plan Pro inclut 10 jours d'essai gratuit. Aucune carte bancaire n'est requise pour commencer.",
  },
  {
    id: "faq-3",
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Absolument. Toutes vos données de trading sont cryptées et stockées de manière sécurisée. Nous ne partageons jamais vos informations.",
  },
];
