"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/shared/api";
import type { Candle } from "@/features/chart/CandlesChart";

type CandlesResponse = {
  candles: Candle[];
};

type CandlesQueryParams = {
  symbol: string;
  timeframe: string;
  from: string;
  to: string;
};

type CandlesCachePayload = {
  key: string;
  candles: Candle[];
  savedAt: string;
};

const CHART_CANDLES_CACHE_KEY = "chart_candles_cache_v1";

export function useChartCandles() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCandles = useCallback(async (params: CandlesQueryParams) => {
    setLoading(true);
    setError(null);

    try {
      const fromIso = toIsoStringSafe(params.from);
      const toIso = toIsoStringSafe(params.to);
      if (!fromIso || !toIso) {
        throw new Error("Invalid date range");
      }
      const qs = new URLSearchParams({
        symbol: params.symbol,
        asset: "FX",
        tf: params.timeframe,
        from: fromIso,
        to: toIso,
      });

      const res = await apiFetch<CandlesResponse>(`/v1/marketdata/candles?${qs.toString()}`);
      const nextCandles = res.candles ?? [];
      setCandles(nextCandles);
      writeCandlesCache({
        key: buildCacheKey({
          symbol: params.symbol,
          timeframe: params.timeframe,
          fromIso,
          toIso
        }),
        candles: nextCandles,
        savedAt: new Date().toISOString()
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load candles");
      setCandles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const hydrateFromCache = useCallback((params: CandlesQueryParams): boolean => {
    const fromIso = toIsoStringSafe(params.from);
    const toIso = toIsoStringSafe(params.to);
    if (!fromIso || !toIso) {
      return false;
    }
    const expectedKey = buildCacheKey({
      symbol: params.symbol,
      timeframe: params.timeframe,
      fromIso,
      toIso
    });
    const cached = readCandlesCache();
    if (!cached || cached.key !== expectedKey) {
      return false;
    }
    setCandles(cached.candles);
    return true;
  }, []);

  return { candles, loading, error, loadCandles, hydrateFromCache };
}

function toIsoStringSafe(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function buildCacheKey(input: { symbol: string; timeframe: string; fromIso: string; toIso: string }): string {
  return `${input.symbol.trim().toUpperCase()}|${input.timeframe}|${input.fromIso}|${input.toIso}`;
}

function readCandlesCache(): CandlesCachePayload | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(CHART_CANDLES_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<CandlesCachePayload>;
    if (typeof parsed.key !== "string" || !Array.isArray(parsed.candles)) {
      return null;
    }
    const candles = parsed.candles.filter(isValidCandle);
    return {
      key: parsed.key,
      candles,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "unknown"
    };
  } catch {
    return null;
  }
}

function writeCandlesCache(payload: CandlesCachePayload): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CHART_CANDLES_CACHE_KEY, JSON.stringify(payload));
}

function isValidCandle(value: unknown): value is Candle {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candle = value as Partial<Candle>;
  return (
    typeof candle.ts === "string" &&
    typeof candle.open === "number" &&
    typeof candle.high === "number" &&
    typeof candle.low === "number" &&
    typeof candle.close === "number"
  );
}
