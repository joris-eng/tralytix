"use client";

import { BarChart3 } from "lucide-react";
import type { CategoryRanking } from "@/shared/profile/types";
import CategoryRankingCard from "./CategoryRankingCard";

interface BenchmarkSectionProps {
  performanceScore: number;
  globalPercentile: number;
  categoryRankings: CategoryRanking[];
}

function PercentileDonut({ percentile }: { percentile: number }) {
  const r = 68,
    cx = 80,
    cy = 80;
  const circ = 2 * Math.PI * r;
  const fill = (percentile / 100) * circ;

  return (
    <div className="relative h-[160px] w-[160px]">
      <svg viewBox="0 0 160 160" width="160" height="160">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="12"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#donutGradProfile)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          transform="rotate(-90 80 80)"
        />
        <defs>
          <linearGradient
            id="donutGradProfile"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#6655ee" />
            <stop offset="100%" stopColor="#00d4e8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span
          className="text-4xl font-extrabold leading-none text-white"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          #{percentile}
        </span>
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40">
          Percentile
        </span>
      </div>
    </div>
  );
}

export default function BenchmarkSection({
  performanceScore,
  globalPercentile,
  categoryRankings,
}: BenchmarkSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/15">
          <BarChart3 className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h2
            className="text-2xl font-extrabold tracking-tight text-white"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Classement &amp; Benchmark
          </h2>
          <p className="text-sm text-cyan-400">
            Comparez vos performances avec des traders similaires
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/40">
          Score de performance
        </span>

        <div className="mt-4 grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-4">
            <div className="flex items-baseline gap-2">
              <span
                className="text-6xl font-extrabold leading-none text-white"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {performanceScore}
              </span>
              <span
                className="text-2xl text-white/40"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                /100
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                style={{ width: `${performanceScore}%` }}
              />
            </div>

            <div className="flex max-w-[380px] flex-col gap-1.5 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.06] p-5">
              <span className="text-sm text-white/50">Meilleur que</span>
              <span
                className="text-5xl font-extrabold leading-none text-cyan-400"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {globalPercentile}%
              </span>
              <span className="text-xs leading-relaxed text-white/50">
                des traders avec un capital similaire ($5k-$15k)
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <PercentileDonut percentile={globalPercentile} />
            <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
              Top Tier
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3
          className="mb-3 text-lg font-bold text-white"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Classement par Catégorie
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryRankings.map((ranking) => (
            <CategoryRankingCard key={ranking.title} ranking={ranking} />
          ))}
        </div>
      </div>
    </section>
  );
}
