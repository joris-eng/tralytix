"use client";

import { useState } from "react";
import { getCandles } from "@/features/marketdata/api";

export function useCandlesProbe() {
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const probe = async () => {
    setLoading(true);
    setError(null);
    const now = new Date();
    const before = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    try {
      const payload = await getCandles({
        symbol: "EURUSD",
        asset: "FX",
        tf: "1h",
        from: before.toISOString(),
        to: now.toISOString()
      });
      setResult(payload);
      return payload;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to query candles");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, probe };
}

