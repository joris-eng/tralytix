"use client";

import { motion } from "motion/react";
import { AlertCircle, CheckCircle, Eye, PauseCircle, X } from "lucide-react";

interface InsightCardProps {
  title: string;
  description: string;
  severity: "critical" | "warning" | "success";
  metric?: string;
  actions?: {
    primary?: { label: string; onClick: () => void };
    secondary?: { label: string; onClick: () => void };
    dismiss?: { onClick: () => void };
  };
}

export default function InsightCard({
  title,
  description,
  severity,
  metric,
  actions,
}: InsightCardProps) {
  const severityConfig = {
    critical: {
      icon: AlertCircle,
      iconColor: "text-red-400",
      borderColor: "border-red-500/20",
      accentColor: "bg-red-500",
    },
    warning: {
      icon: AlertCircle,
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/20",
      accentColor: "bg-amber-500",
    },
    success: {
      icon: CheckCircle,
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/20",
      accentColor: "bg-emerald-500",
    },
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2, transition: { duration: 0.2, ease: "easeOut" } }}
      className={`relative group rounded-2xl bg-[#0f0f14]/80 border ${config.borderColor} backdrop-blur-xl p-6 overflow-hidden transition-all duration-300 hover:border-white/10`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accentColor}`} />

      <div className="flex items-start gap-4">
        <div className={`${config.iconColor} flex-shrink-0 mt-0.5`}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">{description}</p>

          {metric && (
            <div className="mb-4 p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-xs text-gray-600 leading-relaxed">{metric}</p>
            </div>
          )}

          {actions && (
            <div className="flex items-center gap-2 flex-wrap">
              {actions.primary && (
                <button
                  onClick={actions.primary.onClick}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {actions.primary.label}
                </button>
              )}
              {actions.secondary && (
                <button
                  onClick={actions.secondary.onClick}
                  className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <PauseCircle className="w-4 h-4" />
                  {actions.secondary.label}
                </button>
              )}
              {actions.dismiss && (
                <button
                  onClick={actions.dismiss.onClick}
                  className="ml-auto p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
