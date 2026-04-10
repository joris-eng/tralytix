"use client";

import { AlertTriangle } from "lucide-react";
import type { BehavioralRisk } from "@/shared/profile/types";
import {
  getSeverityColor,
  getSeverityProgressWidth,
} from "@/shared/profile/colors";

interface BehavioralRiskCardProps {
  risk: BehavioralRisk;
}

export default function BehavioralRiskCard({ risk }: BehavioralRiskCardProps) {
  const colors = getSeverityColor(risk.severity);
  const progressWidth = getSeverityProgressWidth(risk.severity);

  return (
    <div
      className={`relative rounded-xl border border-l-4 bg-gradient-to-br p-5 ${colors.bg} ${colors.border} ${colors.leftBorder}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${colors.bg}`}
          >
            <AlertTriangle className={`h-4 w-4 ${colors.text}`} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white/90">
              {risk.title}
            </h4>
            <p className="mt-0.5 text-xs text-white/50">{risk.description}</p>
          </div>
        </div>
        <span
          className={`flex-shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors.border} ${colors.text}`}
        >
          {risk.severity}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <span className="text-xs text-white/40">Impact estimé</span>
          <p className={`text-xl font-bold ${colors.text}`}>{risk.impact}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-white/40">Trades concernés</span>
          <p className="text-lg font-semibold text-white/80">{risk.trades}</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${colors.bg}`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
