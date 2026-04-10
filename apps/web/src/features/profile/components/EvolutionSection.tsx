"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { EquityDataPoint, EquityPeriod } from "@/shared/profile/types";

interface EvolutionSectionProps {
  equityData: Record<EquityPeriod, EquityDataPoint[]>;
  activePeriod: EquityPeriod;
  onPeriodChange: (period: EquityPeriod) => void;
}

const PERIODS: EquityPeriod[] = ["1W", "1M", "3M", "1Y"];

export default function EvolutionSection({
  equityData,
  activePeriod,
  onPeriodChange,
}: EvolutionSectionProps) {
  const data = equityData[activePeriod];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/15">
          <TrendingUp className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h2
            className="text-2xl font-extrabold tracking-tight text-white"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Évolution
          </h2>
          <p className="text-sm text-cyan-400">Suivez votre progression</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/40">
            Évolution de l&apos;équité
          </span>
          <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
            {PERIODS.map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => onPeriodChange(period)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  activePeriod === period
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(100,80,220,0.5)" />
                    <stop offset="100%" stopColor="rgba(100,80,220,0)" />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,15,25,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    color: "#fff",
                  }}
                  formatter={(value) => [`${Number(value).toLocaleString("fr-FR")}€`, "Équité"]}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="rgba(120,100,240,0.85)"
                  fill="url(#equityGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex min-w-[220px] max-w-[280px] flex-col gap-1.5 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.06] p-5">
            <span className="text-sm text-white/50">Meilleur que</span>
            <span
              className="text-5xl font-extrabold leading-none text-cyan-400"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              63%
            </span>
            <span className="text-xs leading-relaxed text-white/50">
              des traders avec un capital similaire ($5k-$15k)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
