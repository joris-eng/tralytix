"use client";

import { useHealthVersion } from "@/features/health/hooks";
import { ApiError } from "@/shared/ui/ApiError";
import { JsonBlock } from "@/shared/ui/JsonBlock";

export function HealthVersionCard() {
  const { health, version, loading, error, refresh } = useHealthVersion();

  return (
    <section className="card">
      <h2>Health & Version</h2>
      <button className="primary" onClick={() => void refresh()} disabled={loading}>
        {loading ? "Loading..." : "Refresh"}
      </button>
      {error ? <ApiError message={error} /> : null}
      {health ? <JsonBlock value={{ health, version }} /> : null}
    </section>
  );
}

