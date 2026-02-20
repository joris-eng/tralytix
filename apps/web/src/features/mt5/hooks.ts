"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiHttpError } from "@/shared/api/http";
import { getMt5Status, importMt5Csv } from "@/features/mt5/api";
import type { Mt5StatusModel } from "@/features/mt5/model";

type Mt5StatusState = {
  data: Mt5StatusModel | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useMt5Status(): Mt5StatusState {
  const [data, setData] = useState<Mt5StatusModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await getMt5Status();
      setData(status);
    } catch (err) {
      if (err instanceof ApiHttpError) {
        setError(`${err.message} (status ${err.status})`);
      } else {
        setError(err instanceof Error ? err.message : "Cannot fetch MT5 status");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useMt5Import() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  const upload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const payload = await importMt5Csv(file);
      setResult(payload);
      return payload;
    } catch (err) {
      if (err instanceof ApiHttpError) {
        setError(`${err.message} (status ${err.status})`);
      } else {
        setError(err instanceof Error ? err.message : "Import failed");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { upload, loading, error, result };
}

