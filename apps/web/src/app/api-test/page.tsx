"use client";

import { useEffect, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";

type HealthResponse = {
  status?: string;
  db?: string;
};

function formatUnknown(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function ApiTestPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [tradesJSON, setTradesJSON] = useState<string>("");
  const [tradesError, setTradesError] = useState<string>("");
  const [loadingTrades, setLoadingTrades] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    async function loadHealth() {
      try {
        const data = await apiFetch<HealthResponse>("/health");
        if (!cancelled) {
          setHealth(data);
        }
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }
        if (error instanceof ApiError) {
          setHealthError(error.message);
          return;
        }
        setHealthError("Unable to load health endpoint");
      }
    }
    void loadHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onLoadTrades() {
    setLoadingTrades(true);
    setTradesError("");
    setTradesJSON("");
    try {
      const data = await apiFetch<unknown>("/v1/trades", { token: token.trim() || undefined });
      setTradesJSON(formatUnknown(data));
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setTradesError(`${error.message} (${error.status})`);
        if (error.payload !== undefined) {
          setTradesJSON(formatUnknown(error.payload));
        }
      } else {
        setTradesError("Unable to load trades");
      }
    } finally {
      setLoadingTrades(false);
    }
  }

  return (
    <main>
      <h1>API Test</h1>

      <section>
        <h2>Health</h2>
        {healthError ? (
          <p>{healthError}</p>
        ) : (
          <p>
            status: {health?.status ?? "-"} / db: {health?.db ?? "-"}
          </p>
        )}
      </section>

      <section>
        <h2>Trades</h2>
        <label htmlFor="token">Token</label>
        <input
          id="token"
          type="text"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Bearer token"
          style={{ width: "100%", marginBottom: 8 }}
        />
        <button type="button" onClick={() => void onLoadTrades()} disabled={loadingTrades}>
          {loadingTrades ? "Loading..." : "Load trades"}
        </button>
        {tradesError ? <p>{tradesError}</p> : null}
        {tradesJSON ? <pre>{tradesJSON}</pre> : null}
      </section>
    </main>
  );
}
