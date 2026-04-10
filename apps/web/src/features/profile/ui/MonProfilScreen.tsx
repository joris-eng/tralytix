"use client";

import { useState } from "react";
import { mockProfileData } from "@/shared/profile/mockData";
import type { EquityPeriod } from "@/shared/profile/types";
import TradingIdentitySection from "@/features/profile/components/TradingIdentitySection";
import BehavioralPatternsSection from "@/features/profile/components/BehavioralPatternsSection";
import EvolutionSection from "@/features/profile/components/EvolutionSection";
import BenchmarkSection from "@/features/profile/components/BenchmarkSection";

export default function MonProfilScreen() {
  const [data] = useState(mockProfileData);
  const [equityPeriod, setEquityPeriod] = useState<EquityPeriod>("1M");

  return (
    <div className="flex min-h-screen flex-col gap-10 bg-[var(--ui-color-bg)] p-6 md:p-10">
      <TradingIdentitySection
        radarData={data.radarData}
        performanceScore={data.performanceScore}
      />

      <BehavioralPatternsSection risks={data.behavioralRisks} />

      <EvolutionSection
        equityData={data.equityData}
        activePeriod={equityPeriod}
        onPeriodChange={setEquityPeriod}
      />

      <BenchmarkSection
        performanceScore={data.performanceScore}
        globalPercentile={data.globalPercentile}
        categoryRankings={data.categoryRankings}
      />
    </div>
  );
}
