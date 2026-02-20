"use client";

import { useMt5Status } from "@/features/mt5/hooks";
import { ApiError } from "@/shared/ui/ApiError";
import { JsonBlock } from "@/shared/ui/JsonBlock";

export function Mt5StatusCard() {
  const { data, loading, error, refresh } = useMt5Status();

  return (
    <section className="card">
      <h2>MT5 Status</h2>
      <button className="primary" onClick={() => void refresh()} disabled={loading}>
        {loading ? "Loading..." : "Refresh"}
      </button>
      {error ? <ApiError message={error} /> : null}
      {data ? <JsonBlock value={data} /> : null}
    </section>
  );
}

