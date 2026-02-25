"use client";

import { useState } from "react";

import { TokenInput } from "@/components/TokenInput";
import { ApiError, apiFetch } from "@/lib/api";

type Trade = {
  id?: string;
  side?: string;
  qty?: number;
  entry_price?: number;
  opened_at?: string;
  fees?: number;
};

type TradesResponse = {
  trades?: Trade[];
  count?: number;
};

function formatUnknown(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function TradesPage() {
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [count, setCount] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [errorPayload, setErrorPayload] = useState<string>("");

  async function onLoadTrades() {
    setLoading(true);
    setError("");
    setErrorPayload("");
    try {
      const data = await apiFetch<TradesResponse>("/v1/trades", { token: token.trim() || undefined });
      const nextTrades = Array.isArray(data.trades) ? data.trades : [];
      setTrades(nextTrades);
      setCount(typeof data.count === "number" ? data.count : nextTrades.length);
    } catch (err: unknown) {
      setTrades([]);
      setCount(0);
      if (err instanceof ApiError) {
        setError(`${err.message} (${err.status})`);
        if (err.payload !== undefined) {
          setErrorPayload(formatUnknown(err.payload));
        }
      } else {
        setError("Unable to load trades");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Trades</h1>

      <section>
        <TokenInput id="trades-token" onTokenChange={setToken} />
        <button type="button" onClick={() => void onLoadTrades()} disabled={loading}>
          {loading ? "Loading..." : "Load trades"}
        </button>
      </section>

      {error ? <p>{error}</p> : null}
      {errorPayload ? <pre>{errorPayload}</pre> : null}

      <section>
        <p>count: {count}</p>
        <ul>
          {trades.map((trade, index) => (
            <li key={trade.id ?? `${trade.opened_at ?? "trade"}-${index}`}>
              id: {trade.id ?? "-"} | side: {trade.side ?? "-"} | qty: {trade.qty ?? "-"} | entry_price:{" "}
              {trade.entry_price ?? "-"} | opened_at: {trade.opened_at ?? "-"} | fees: {trade.fees ?? "-"}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
