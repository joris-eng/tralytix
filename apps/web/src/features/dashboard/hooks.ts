"use client";

import { useCallback, useState } from "react";
import { ApiHttpError } from "@/shared/api/http";
import { fetchDashboardInsights, fetchDashboardSummary } from "@/features/dashboard/api";
import type { DashboardInsights, DashboardSummary } from "@/features/dashboard/model";

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await fetchDashboardSummary();
      setData(summary);
    } catch (err) {
      if (err instanceof ApiHttpError) {
        setError(`${err.message} (status ${err.status})`);
      } else {
        setError(err instanceof Error ? err.message : "Unable to load dashboard summary");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, refresh };
}

export function useDashboardInsights() {
  const [data, setData] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const insights = await fetchDashboardInsights();
      setData(insights);
    } catch (err) {
      if (err instanceof ApiHttpError) {
        setError(`${err.message} (status ${err.status})`);
      } else {
        setError(err instanceof Error ? err.message : "Unable to load dashboard insights");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, refresh };
}
