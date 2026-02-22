"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/shared/api";

type SummaryResponse = {
  trades_count: number;
  winrate: number;
  avg_pnl: number;
  profit_factor: number;
};

export function useStatsSummary() {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<SummaryResponse>("/v1/analytics/summary");
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load summary");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, loadSummary };
}
