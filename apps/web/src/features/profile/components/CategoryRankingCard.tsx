"use client";

import type { CategoryRanking } from "@/shared/profile/types";
import { getColorClasses } from "@/shared/profile/colors";

interface CategoryRankingCardProps {
  ranking: CategoryRanking;
}

export default function CategoryRankingCard({
  ranking,
}: CategoryRankingCardProps) {
  const colors = getColorClasses(ranking.color);
  const Icon = ranking.icon;

  return (
    <div
      className={`rounded-xl border p-5 ${colors.bg} ${colors.border} transition-all duration-200 hover:border-opacity-40`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg border ${colors.bg} ${colors.border}`}
        >
          <Icon className={`h-4 w-4 ${colors.text}`} />
        </div>
        <span className="text-sm font-medium text-white/60">
          {ranking.title}
        </span>
      </div>

      <div className="mb-2">
        <span className={`text-2xl font-bold ${colors.text}`}>
          Top {ranking.percentile}%
        </span>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-sm text-white/50">{ranking.value}</span>
        <span className="text-xs font-semibold text-emerald-400">↑ +6%</span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full ${colors.text.replace("text-", "bg-")}`}
          style={{ width: `${100 - ranking.percentile}%` }}
        />
      </div>
    </div>
  );
}
