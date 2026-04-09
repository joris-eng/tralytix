"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Bell } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/shared/contexts/LanguageContext";

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateAlertModal({ isOpen, onClose }: CreateAlertModalProps) {
  const { t } = useLanguage();
  const [metric, setMetric] = useState("winRate");
  const [condition, setCondition] = useState("below");
  const [threshold, setThreshold] = useState("");
  const [channel, setChannel] = useState("inApp");

  const handleSave = () => {
    console.log({ metric, condition, threshold, channel });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-cyan-500/20 shadow-2xl overflow-hidden"
            >
              <div className="relative p-6 border-b border-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h2 className="text-xl font-bold">{t("alerts.createAlert")}</h2>
                  </div>
                  <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t("alerts.metric")}</label>
                  <select
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                    className="w-full bg-[#0f1219] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  >
                    <option value="winRate">{t("alerts.metricWinRate")}</option>
                    <option value="drawdown">{t("alerts.metricDrawdown")}</option>
                    <option value="dailyLoss">{t("alerts.metricDailyLoss")}</option>
                    <option value="tradeCount">{t("alerts.metricTradeCount")}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t("alerts.condition")}</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full bg-[#0f1219] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                    >
                      <option value="above">{t("alerts.conditionAbove")}</option>
                      <option value="below">{t("alerts.conditionBelow")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t("alerts.threshold")}</label>
                    <input
                      type="number"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#0f1219] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t("alerts.notificationChannel")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setChannel("inApp")}
                      className={`px-4 py-3 rounded-xl border transition-all ${
                        channel === "inApp"
                          ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                          : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      {t("alerts.channelInApp")}
                    </button>
                    <button
                      onClick={() => setChannel("email")}
                      className={`px-4 py-3 rounded-xl border transition-all ${
                        channel === "email"
                          ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                          : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      {t("alerts.channelEmail")}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex gap-3">
                <button onClick={onClose} className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors">
                  {t("alerts.cancel")}
                </button>
                <button onClick={handleSave} className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all">
                  {t("alerts.save")}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
