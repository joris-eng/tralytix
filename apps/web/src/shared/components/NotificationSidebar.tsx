"use client";

import { motion, AnimatePresence } from "motion/react";
import { Bell, TrendingUp, AlertTriangle, ChevronRight, X, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import CreateAlertModal from "./CreateAlertModal";

interface Alert {
  id: string;
  type: "opportunity" | "risk";
  title: string;
  description: string;
  timestamp: Date;
}

export default function NotificationSidebar() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isCreateAlertOpen, setIsCreateAlertOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const mockAlerts: Alert[] = [
      { id: "1", type: "opportunity", title: t("alerts.opportunity"), description: t("alerts.opportunityMsg"), timestamp: new Date() },
      { id: "2", type: "risk", title: t("alerts.excessiveRisk"), description: t("alerts.excessiveRiskMsg"), timestamp: new Date(Date.now() - 300000) },
      { id: "3", type: "opportunity", title: t("alerts.opportunity"), description: t("alerts.opportunityMsg"), timestamp: new Date(Date.now() - 600000) },
    ];
    setAlerts(mockAlerts);

    const interval = setInterval(() => {
      const newAlert: Alert = {
        id: Date.now().toString(),
        type: Math.random() > 0.5 ? "opportunity" : "risk",
        title: Math.random() > 0.5 ? t("alerts.opportunity") : t("alerts.excessiveRisk"),
        description: Math.random() > 0.5 ? t("alerts.opportunityMsg") : t("alerts.excessiveRiskMsg"),
        timestamp: new Date(),
      };
      setAlerts((prev) => [newAlert, ...prev].slice(0, 5));
    }, 45000);

    return () => clearInterval(interval);
  }, [t]);

  const getAlertConfig = (type: Alert["type"]) => {
    if (type === "opportunity") {
      return {
        icon: TrendingUp,
        gradient: "from-cyan-500/20 via-cyan-500/10 to-transparent",
        borderGlow: "shadow-[0_0_20px_rgba(6,182,212,0.3)]",
        iconBg: "bg-gradient-to-br from-cyan-500/20 to-cyan-600/10",
        iconColor: "text-cyan-400",
        accentBorder: "border-l-cyan-500",
        glowColor: "shadow-cyan-500/50",
      };
    }
    return {
      icon: AlertTriangle,
      gradient: "from-orange-500/20 via-orange-500/10 to-transparent",
      borderGlow: "shadow-[0_0_20px_rgba(249,115,22,0.3)]",
      iconBg: "bg-gradient-to-br from-orange-500/20 to-orange-600/10",
      iconColor: "text-orange-400",
      accentBorder: "border-l-orange-500",
      glowColor: "shadow-orange-500/50",
    };
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="hidden lg:flex fixed right-4 top-24 z-50 items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 backdrop-blur-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
      >
        <motion.div animate={{ rotate: isOpen ? 0 : 180 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
          <ChevronRight className="w-5 h-5 text-cyan-400" />
        </motion.div>
        {alerts.length > 0 && (
          <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 border-2 border-[#0a0a0f] flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{alerts.length}</span>
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="hidden lg:flex fixed right-0 top-0 h-screen w-[340px] border-l border-white/[0.08] bg-gradient-to-b from-[#0a0a0f]/60 via-[#0f0f14]/80 to-[#0a0a0f]/60 backdrop-blur-2xl flex-col z-40"
          >
            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />

            <div className="p-6 border-b border-white/[0.08] relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-cyan-400" />
                      {alerts.length > 0 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 border-2 border-[#0a0a0f] flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">{alerts.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Alertes en temps réel</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Live Updates</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-center group"
                >
                  <X className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
                </motion.button>
              </div>

              <motion.button
                onClick={() => setIsCreateAlertOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full mt-4 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 hover:border-cyan-500/50 transition-all flex items-center justify-center gap-2 group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Plus className="w-4 h-4 text-cyan-400 relative" />
                <span className="text-sm font-medium text-cyan-400 relative">{t("alerts.createAlert")}</span>
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 space-y-3">
              <AnimatePresence>
                {alerts.map((alert, index) => {
                  const config = getAlertConfig(alert.type);
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={alert.id}
                      layout
                      initial={{ opacity: 0, x: 50, scale: 0.8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 50, scale: 0.8, transition: { duration: 0.2 } }}
                      transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                      className="group relative"
                    >
                      <div className={`relative rounded-2xl border border-white/[0.08] ${config.borderGlow} backdrop-blur-xl overflow-hidden`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />
                        <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${config.accentBorder.replace("border-l-", "from-")} to-transparent`} />
                        <div className="relative p-4">
                          <div className="flex gap-3">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.iconBg} border border-white/10 flex items-center justify-center ${config.glowColor} shadow-lg`}>
                              <Icon className={`w-5 h-5 ${config.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-white mb-1 line-clamp-1">{alert.title}</h4>
                              <p className="text-xs text-gray-400 line-clamp-2 mb-2 leading-relaxed">{alert.description}</p>
                              <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                                {alert.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <motion.button
                              initial={{ opacity: 0, scale: 0.5 }}
                              whileHover={{ scale: 1.1, opacity: 1 }}
                              onClick={() => removeAlert(alert.id)}
                              className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3 h-3 text-gray-400 hover:text-red-400 transition-colors" />
                            </motion.button>
                          </div>
                        </div>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "linear" }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {alerts.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-500/20 to-gray-600/10 border border-gray-500/30 flex items-center justify-center">
                    <Bell className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-500">Aucune alerte pour le moment</p>
                </motion.div>
              )}
            </div>

            <div className="h-20 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
          </motion.aside>
        )}
      </AnimatePresence>

      <CreateAlertModal isOpen={isCreateAlertOpen} onClose={() => setIsCreateAlertOpen(false)} />
    </>
  );
}
