"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/shared/api";
import type { Candle } from "@/features/chart/CandlesChart";

type CandlesResponse = {
  candles: Candle[];
};

export function useChartCandles() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCandles = useCallback(async (params: {
    symbol: string;
    timeframe: string;
    from: string;
    to: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams({
        symbol: params.symbol,
        asset: "FX",
        tf: params.timeframe,
        from: new Date(params.from).toISOString(),
        to: new Date(params.to).toISOString(),
      });

      const res = await apiFetch<CandlesResponse>(`/v1/marketdata/candles?${qs.toString()}`);
      setCandles(res.candles ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load candles");
      setCandles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { candles, loading, error, loadCandles };
}
