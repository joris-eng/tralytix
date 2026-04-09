"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import { useState } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  isPrimary?: boolean;
  intelligence?: string;
  tooltip?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  isPrimary = false,
  intelligence,
  tooltip,
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
      className={`relative group rounded-2xl backdrop-blur-xl p-6 overflow-hidden transition-all duration-300 ${
        isPrimary
          ? "bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 shadow-lg shadow-cyan-500/5 hover:shadow-cyan-500/10"
          : "bg-[#0f0f14]/80 border border-white/[0.06] hover:border-white/10 shadow-sm"
      }`}
    >
      {isPrimary && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              {title}
            </span>
            {tooltip && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-gray-500 hover:text-cyan-400 transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-0 top-6 w-56 p-3 rounded-xl bg-black/95 border border-cyan-500/30 backdrop-blur-xl shadow-xl z-50"
                  >
                    <p className="text-xs text-gray-300 leading-relaxed">{tooltip}</p>
                  </motion.div>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div className={isPrimary ? "text-cyan-400" : "text-gray-600"}>
              <Icon className="w-5 h-5" strokeWidth={2} />
            </div>
          )}
        </div>

        <div className="text-4xl font-bold mb-2 text-white tracking-tight">{value}</div>

        {subtitle && <div className="text-sm text-gray-500 font-medium">{subtitle}</div>}

        {intelligence && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-gray-600 leading-relaxed">{intelligence}</p>
          </div>
        )}
      </div>

      {isPrimary && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500 opacity-60" />
      )}
    </motion.div>
  );
}
