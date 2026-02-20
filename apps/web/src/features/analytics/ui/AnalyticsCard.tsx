"use client";

import { useEffect } from "react";
import { useAnalytics } from "@/features/analytics/hooks";
import { ApiError } from "@/shared/ui/ApiError";
import { JsonBlock } from "@/shared/ui/JsonBlock";

export function AnalyticsCard() {
  const { data, loading, error, refresh, recompute, recomputeResult } = useAnalytics();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <section className="card">
      <h2>Analytics</h2>
      <div className="row">
        <button className="primary" onClick={() => void refresh()} disabled={loading}>
          {loading ? "Loading..." : "Refresh analytics"}
        </button>
        <button onClick={() => void recompute()} disabled={loading}>
          Recompute daily
        </button>
      </div>
      {error ? <ApiError message={error} /> : null}
      {recomputeResult ? <JsonBlock value={{ recompute: recomputeResult }} /> : null}
      {data ? <JsonBlock value={data} /> : null}
    </section>
  );
}

