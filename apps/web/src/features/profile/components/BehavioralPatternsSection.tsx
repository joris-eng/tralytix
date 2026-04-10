"use client";

import { Brain } from "lucide-react";
import type { BehavioralRisk } from "@/shared/profile/types";
import BehavioralRiskCard from "./BehavioralRiskCard";

interface BehavioralPatternsSectionProps {
  risks: BehavioralRisk[];
}

export default function BehavioralPatternsSection({
  risks,
}: BehavioralPatternsSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/15">
          <Brain className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h2
            className="text-2xl font-extrabold tracking-tight text-white"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Patterns Comportementaux
          </h2>
          <p className="text-sm text-cyan-400">
            Identifiez vos comportements de trading
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {risks.map((risk) => (
          <BehavioralRiskCard key={risk.title} risk={risk} />
        ))}
      </div>
    </section>
  );
}
