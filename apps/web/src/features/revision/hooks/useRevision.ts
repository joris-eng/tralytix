"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { revisionApi } from "@/features/revision/api/revisionApi";
import type {
  TradeWithReview,
  ReviewStats,
  UpsertReviewPayload,
  Review,
} from "@/features/revision/model/types";

export function useRevisionList() {
  const [trades, setTrades] = useState<TradeWithReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await revisionApi.list();
      if (!mountedRef.current) return;
      setTrades(res.trades);
      setStats(res.stats);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => { mountedRef.current = false; };
  }, [load]);

  return { trades, stats, loading, error, refresh: load };
}

export function useUpsertReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsert = useCallback(
    async (tradeID: number, payload: UpsertReviewPayload): Promise<Review | null> => {
      setLoading(true);
      setError(null);
      try {
        return await revisionApi.upsert(tradeID, payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { upsert, loading, error };
}
