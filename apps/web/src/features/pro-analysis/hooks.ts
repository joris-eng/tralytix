"use client";

import { useCallback, useState } from "react";
import { ApiHttpError } from "@/shared/api/http";
import { fetchProAnalysisTrades } from "@/features/pro-analysis/api";
import type { ProAnalysisTradesResponse } from "@/features/pro-analysis/model";

export function useProAnalysisTrades(limit?: number, offset?: number) {
  const [data, setData] = useState<ProAnalysisTradesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const trades = await fetchProAnalysisTrades(limit, offset);
      setData(trades);
    } catch (err) {
      if (err instanceof ApiHttpError) {
        setError(`${err.message} (status ${err.status})`);
      } else {
        setError(err instanceof Error ? err.message : "Unable to load pro analysis trades");
      }
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  return { data, loading, error, refresh };
}
