"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { Trophy } from "lucide-react";
import type { RadarMetric } from "@/shared/profile/types";

interface TradingIdentitySectionProps {
  radarData: RadarMetric[];
  performanceScore: number;
}

export default function TradingIdentitySection({
  radarData,
  performanceScore,
}: TradingIdentitySectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/15">
          <Trophy className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Identité de Trading
          </h2>
          <p className="text-sm text-cyan-400">
            Analyse de vos compétences de trading
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/40">
          Analyse des métriques
        </span>

        <div className="mt-4 grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div className="w-full max-w-[420px]">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  dataKey="value"
                  stroke="rgba(140,100,255,0.7)"
                  fill="rgba(100,80,220,0.25)"
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex min-w-[220px] max-w-[280px] flex-col gap-1.5 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.06] p-5">
            <span className="text-sm text-white/50">Meilleur que</span>
            <span
              className="text-5xl font-extrabold leading-none text-cyan-400"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {performanceScore}%
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
