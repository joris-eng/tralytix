"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Language = "en" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("fr");

  const handleSetLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang);
    }
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: unknown = translations[language];
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return (value as string) || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const translations: Record<Language, Record<string, unknown>> = {
  en: {
    nav: {
      dashboard: "Dashboard",
      proAnalysis: "Pro Analysis",
      tradingJournal: "Trading Journal",
      plans: "Plans",
      tradeReview: "Trade Review",
      trades: "Trades",
      analysis: "Analysis",
      import: "Import",
      monProfil: "My Profile",
    },
    dashboard: {
      title: "Dashboard",
      trades: "trades",
      winRate: "win rate",
      lastDays: "Last 90 days",
      last30Days: "Last 30 days",
      performanceScore: "Performance Score",
      performanceScoreSub: "trades analyzed.",
      winRateTitle: "Win Rate",
      winRateSub: "Derived from closed trades.",
      profitFactor: "Profit Factor",
      profitFactorSub: "Avg PnL",
      totalProfit: "Total Profit",
      totalProfitSub: "W / L",
      equityCurve: "Equity Curve",
      months: "months",
    },
    alerts: {
      opportunity: "Opportunity detected",
      opportunityMsg: "Your success rate on GBP/USD is 65% this month.",
      excessiveRisk: "Excessive risk",
      excessiveRiskMsg: "Your EUR/USD exposure exceeds 40% of your capital.",
      createAlert: "Create Alert",
      metric: "Metric",
      metricWinRate: "Win Rate",
      metricDrawdown: "Drawdown",
      metricDailyLoss: "Daily Loss",
      metricTradeCount: "Trade Count",
      condition: "Condition",
      conditionAbove: "Above",
      conditionBelow: "Below",
      threshold: "Threshold",
      notificationChannel: "Notification Channel",
      channelInApp: "In-App",
      channelEmail: "Email",
      save: "Save Alert",
      cancel: "Cancel",
    },
    common: { win: "W", loss: "L" },
    pdfExport: {
      title: "Export Monthly Report",
      month: "March 2026",
      reportSections: "Report Sections",
      performanceSummary: "Performance Summary",
      equityCurve: "Equity Curve",
      topInsights: "Top Insights",
      tradeBreakdown: "Trade Breakdown",
      infoText: "Your PDF report will include all performance metrics, charts, and insights for the selected period.",
      cancel: "Cancel",
      download: "Download PDF",
    },
  },
  fr: {
    nav: {
      dashboard: "Dashboard",
      proAnalysis: "Pro Analysis",
      tradingJournal: "Journal de Trading",
      plans: "Plans",
      tradeReview: "Révision des Trades",
      trades: "Trades",
      analysis: "Analyse",
      import: "Import",
      monProfil: "Mon Profil",
    },
    dashboard: {
      title: "Dashboard",
      trades: "trades",
      winRate: "win rate",
      lastDays: "Derniers 90 jours",
      last30Days: "Derniers 30 jours",
      performanceScore: "Performance Score",
      performanceScoreSub: "trades analysés.",
      winRateTitle: "Win Rate",
      winRateSub: "Dérivé des trades clôturés.",
      profitFactor: "Profit Factor",
      profitFactorSub: "PnL moy",
      totalProfit: "Profit Total",
      totalProfitSub: "G / P",
      equityCurve: "Equity Curve",
      months: "mois",
    },
    alerts: {
      opportunity: "Opportunité détectée",
      opportunityMsg: "Votre taux de réussite sur GBP/USD est de 65% ce mois-ci.",
      excessiveRisk: "Risque excessif",
      excessiveRiskMsg: "Votre exposition sur EUR/USD dépasse 40% de votre capital.",
      createAlert: "Créer une alerte",
      metric: "Métrique",
      metricWinRate: "Taux de victoire",
      metricDrawdown: "Drawdown",
      metricDailyLoss: "Perte quotidienne",
      metricTradeCount: "Nombre de trades",
      condition: "Condition",
      conditionAbove: "Supérieur à",
      conditionBelow: "Inférieur à",
      threshold: "Seuil",
      notificationChannel: "Canal de notification",
      channelInApp: "Dans l'application",
      channelEmail: "Email",
      save: "Enregistrer l'alerte",
      cancel: "Annuler",
    },
    common: { win: "G", loss: "P" },
    pdfExport: {
      title: "Export Monthly Report",
      month: "Mars 2026",
      reportSections: "Sections du rapport",
      performanceSummary: "Résumé de performance",
      equityCurve: "Equity Curve",
      topInsights: "Top Insights",
      tradeBreakdown: "Détail des trades",
      infoText: "Votre rapport PDF inclura toutes les métriques de performance, graphiques et insights pour la période sélectionnée.",
      cancel: "Annuler",
      download: "Télécharger PDF",
    },
  },
};
