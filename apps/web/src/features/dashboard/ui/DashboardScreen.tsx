"use client";

import { motion } from "motion/react";
import {
  TrendingUp, Target, BarChart, DollarSign, Calendar,
  AlertTriangle, ArrowRight, Sparkles, FileDown, RefreshCw,
} from "lucide-react";
import MetricCard from "@/shared/components/MetricCard";
import PDFExportModal from "@/shared/components/PDFExportModal";
import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useDashboardSummary, useDashboardInsights } from "@/features/dashboard/hooks";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, Cell,
} from "recharts";

const tradePerformanceByNumber = [
  { trade: "Trade 1", avgReturn: 8.2, id: "trade-perf-1" },
  { trade: "Trade 2", avgReturn: 6.4, id: "trade-perf-2" },
  { trade: "Trade 3", avgReturn: 2.1, id: "trade-perf-3" },
  { trade: "Trade 4+", avgReturn: -21, id: "trade-perf-4" },
];

const mockEquityCurve = Array.from({ length: 90 }, (_, i) => {
  const base = 10000;
  const trend = i * 12;
  const noise = Math.sin(i * 0.5) * 800 + Math.cos(i * 0.3) * 400;
  return {
    date: new Date(Date.now() - (89 - i) * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    equity: Math.round(base + trend + noise),
    id: `eq-${i}`,
  };
});

function parseNum(val: string | null | undefined): number {
  if (!val) return 0;
  const n = Number.parseFloat(val);
  return Number.isFinite(n) ? n : 0;
}

export default function DashboardScreen() {
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const { t } = useLanguage();

  const { data: summary, loading: summaryLoading, refresh: refreshSummary } = useDashboardSummary();
  const { data: insights, loading: insightsLoading, refresh: refreshInsights } = useDashboardInsights();

  useEffect(() => {
    void refreshSummary();
    void refreshInsights();
  }, [refreshSummary, refreshInsights]);

  const isLoading = summaryLoading || insightsLoading;

  const totalTrades = summary?.total_trades ?? 0;
  const winRate = parseNum(summary?.win_rate) * 100;
  const profitFactor = parseNum(summary?.profit_factor);
  const totalProfit = parseNum(summary?.total_profit);
  const avgProfit = parseNum(summary?.avg_profit);
  const performanceScore = useMemo(
    () => Math.min(100, Math.round(winRate * 0.5 + Math.min(profitFactor, 2) * 25 + 25)),
    [winRate, profitFactor],
  );

  if (isLoading) {
    return (
      <div className="space-y-10">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin" />
            <p className="text-gray-400 text-lg">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent tracking-tight"
          >
            {t("dashboard.title")}
          </motion.h1>
          <div className="flex items-center gap-3 text-gray-400 flex-wrap">
            <span className="text-sm font-medium">{totalTrades} {t("dashboard.trades")}</span>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <span className="text-sm font-medium">{winRate.toFixed(1)}% {t("dashboard.winRate")}</span>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <span className="text-sm font-medium">{t("dashboard.lastDays")}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6 flex-wrap">
          {/* Performance Score Badge */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative px-6 md:px-8 py-4 md:py-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-400/30 backdrop-blur-sm">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Performance Score</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {performanceScore}
                </span>
                <span className="text-sm text-gray-400">/100</span>
              </div>
              <div className="text-xs text-cyan-400 mt-1">
                {performanceScore >= 70 ? "Top 10% trader" : performanceScore >= 50 ? "Top 30% trader" : "Developing trader"}
              </div>
            </div>
          </motion.div>

          {/* PDF Export Button */}
          <motion.button
            onClick={() => setIsPDFModalOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
          >
            <FileDown className="w-4 h-4" />
            {t("pdfExport.title")}
          </motion.button>

          <button className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 hover:border-white/20 transition-all duration-300 backdrop-blur-sm">
            {t("dashboard.last30Days")}
          </button>
        </div>
      </div>

      <PDFExportModal isOpen={isPDFModalOpen} onClose={() => setIsPDFModalOpen(false)} />

      {/* TOP INSIGHT CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group rounded-3xl bg-gradient-to-br from-amber-500/10 via-red-500/10 to-orange-500/10 border border-amber-500/30 backdrop-blur-2xl p-8 overflow-hidden shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
          <AlertTriangle className="w-full h-full text-amber-400" />
        </div>

        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-white">⚠️ Top Performance Insight</h2>
                <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Critical
                </div>
              </div>
              <p className="text-gray-400 text-lg">
                {insights?.top_insights?.[0]?.detail || "Your performance drops significantly after your 3rd trade of the day."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
              <h3 className="text-sm text-gray-400 mb-4 uppercase tracking-wider">Average Return by Trade Number</h3>
              <ResponsiveContainer width="100%" height={180}>
                <RechartsBarChart data={tradePerformanceByNumber} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <XAxis dataKey="trade" stroke="#6b7280" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#6b7280" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    formatter={(value) => [`${value}%`, "Avg Return"]}
                    cursor={false}
                    isAnimationActive={false}
                  />
                  <Bar dataKey="avgReturn" fill="#06b6d4" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                    {tradePerformanceByNumber.map((entry) => (
                      <Cell key={entry.id} fill={entry.avgReturn < 0 ? "#ef4444" : "#10b981"} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Trade 1-3</div>
                  <div className="text-2xl font-bold text-emerald-400">+5.6%</div>
                  <div className="text-xs text-gray-400 mt-1">avg per trade</div>
                </div>
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Trade 4+</div>
                  <div className="text-2xl font-bold text-red-400">-21%</div>
                  <div className="text-xs text-gray-400 mt-1">avg per trade</div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <h4 className="font-bold text-white">Suggested Improvement</h4>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-3">
                  Limit your daily trading sessions to <span className="text-cyan-400 font-bold">3 trades maximum</span>.
                  Your decision quality decreases significantly after the third trade, likely due to fatigue or overtrading.
                </p>
                <button className="w-full mt-2 px-4 py-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-medium text-sm hover:bg-cyan-500/30 transition-colors flex items-center justify-center gap-2">
                  Set Trade Limit
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title={t("dashboard.performanceScore")}
          value={performanceScore.toString()}
          subtitle={`${totalTrades} ${t("dashboard.performanceScoreSub")}`}
          icon={Target}
          isPrimary
          intelligence={
            performanceScore >= 70
              ? "Top 10% performance vs similar traders"
              : performanceScore >= 50
              ? "Top 30% performance vs similar traders"
              : "Keep improving your trading skills"
          }
        />
        <MetricCard
          title={t("dashboard.winRateTitle")}
          value={`${winRate.toFixed(1)}%`}
          subtitle={t("dashboard.winRateSub")}
          icon={TrendingUp}
        />
        <MetricCard
          title={t("dashboard.profitFactor")}
          value={profitFactor.toFixed(2)}
          subtitle={`${t("dashboard.profitFactorSub")}: ${avgProfit.toFixed(2)}`}
          icon={BarChart}
        />
        <MetricCard
          title={t("dashboard.totalProfit")}
          value={totalProfit >= 0 ? `$${totalProfit.toFixed(2)}` : `-$${Math.abs(totalProfit).toFixed(2)}`}
          subtitle={
            summary
              ? `${summary.winners}${t("common.win")} / ${summary.losers}${t("common.loss")}`
              : t("dashboard.totalProfitSub")
          }
          icon={DollarSign}
          intelligence="Best performing pair: EUR/USD"
          tooltip="Total net profit/loss from all closed trades, including commissions and swaps"
        />
      </div>

      {/* Equity Curve */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative group rounded-3xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-cyan-500/5 border border-cyan-500/20 backdrop-blur-2xl p-8 overflow-hidden shadow-2xl shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all duration-500"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-400 via-blue-400 to-cyan-500 opacity-10 blur-3xl rounded-full -translate-y-20 translate-x-20" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {t("dashboard.equityCurve")}
              </h2>
              <div className="h-0.5 w-20 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 rounded-full" />
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-gray-300">9 {t("dashboard.months")}</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockEquityCurve} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#6b7280" axisLine={false} tickLine={false} />
              <YAxis stroke="#6b7280" axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0a0a0f",
                  border: "1px solid #06b6d430",
                  borderRadius: "12px",
                  backdropFilter: "blur(20px)",
                }}
                labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                itemStyle={{ color: "#06b6d4" }}
                cursor={false}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke="#06b6d4"
                strokeWidth={3}
                fill="url(#equityGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
