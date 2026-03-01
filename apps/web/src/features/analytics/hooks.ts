"use client";

import { useCallback, useState } from "react";
import { ApiHttpError } from "@/shared/api/http";
import {
  getAnalyticsSummary,
  getMt5AnalyticsEquity,
  getMt5AnalyticsInsights,
  getMt5AnalyticsSummary,
  recomputeMt5AnalyticsDaily
} from "@/features/analytics/api";
import type {
  AnalyticsSummaryModel,
  Mt5AnalyticsSummaryModel,
  Mt5EquityModel,
  Mt5InsightsModel
} from "@/features/analytics/model";

type AnalyticsData = {
  summary: AnalyticsSummaryModel;
  mt5Summary: Mt5AnalyticsSummaryModel;
  insights: Mt5InsightsModel;
  equity: Mt5EquityModel;
};

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recomputeResult, setRecomputeResult] = useState<unknown>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, mt5Summary, insights, equity] = await Promise.all([
        getAnalyticsSummary(),
        getMt5AnalyticsSummary(),
        getMt5AnalyticsInsights(),
        getMt5AnalyticsEquity()
      ]);
      setData({ summary, mt5Summary, insights, equity });
    } catch (err) {
      if (err instanceof ApiHttpError) {
        setError(`${err.message} (status ${err.status})`);
      } else {
        setError(err instanceof Error ? err.message : "Unable to load analytics");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const recompute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await recomputeMt5AnalyticsDaily();
      setRecomputeResult(result);
      await refresh();
      return result;
    } catch (err) {
      if (err instanceof ApiHttpError) {
        setError(`${err.message} (status ${err.status})`);
      } else {
        setError(err instanceof Error ? err.message : "Unable to recompute daily analytics");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  return { data, loading, error, refresh, recompute, recomputeResult };
}

