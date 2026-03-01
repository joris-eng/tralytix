"use client";

import { useCallback, useState } from "react";
import { ApiHttpError } from "@/shared/api/http";
import { createTrade, listTrades } from "@/features/trades/api";
import type { TradeCreateInput, TradeModel } from "@/features/trades/model";

export function useTrades() {
  const [items, setItems] = useState<TradeModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listTrades());
    } catch (err) {
      if (err instanceof ApiHttpError) {
        setError(`${err.message} (status ${err.status})`);
      } else {
        setError(err instanceof Error ? err.message : "Unable to list trades");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const submit = useCallback(async (payload: TradeCreateInput) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createTrade(payload);
      await refresh();
      return result;
    } catch (err) {
      if (err instanceof ApiHttpError) {
        setError(`${err.message} (status ${err.status})`);
      } else {
        setError(err instanceof Error ? err.message : "Unable to create trade");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  return { items, loading, error, refresh, submit };
}

