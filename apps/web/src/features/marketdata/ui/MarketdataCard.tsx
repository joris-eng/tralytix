"use client";

import { useCandlesProbe } from "@/features/marketdata/hooks";
import { ApiError } from "@/shared/ui/ApiError";
import { JsonBlock } from "@/shared/ui/JsonBlock";

export function MarketdataCard() {
  const { result, loading, error, probe } = useCandlesProbe();

  return (
    <section className="card">
      <h2>Marketdata Candles</h2>
      <button className="primary" onClick={() => void probe()} disabled={loading}>
        {loading ? "Loading..." : "Probe candles"}
      </button>
      {error ? <ApiError message={error} /> : null}
      {result ? <JsonBlock value={result} /> : null}
    </section>
  );
}

