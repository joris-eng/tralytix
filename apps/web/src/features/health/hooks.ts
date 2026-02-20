"use client";

import { useCallback, useEffect, useState } from "react";
import { getHealth, getVersion } from "@/features/health/api";
import type { HealthModel, VersionModel } from "@/features/health/model";

type HealthState = {
  health: HealthModel | null;
  version: VersionModel | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useHealthVersion(): HealthState {
  const [health, setHealth] = useState<HealthModel | null>(null);
  const [version, setVersion] = useState<VersionModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthData, versionData] = await Promise.all([getHealth(), getVersion()]);
      setHealth(healthData);
      setVersion(versionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load system endpoints");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { health, version, loading, error, refresh };
}

