"use client";

import { useEffect, useState } from "react";

import { TokenInput } from "@/components/TokenInput";
import { ApiError, apiFetch } from "@/lib/api";
import { fetchAuthMe } from "@/lib/authApi";
import { clearToken, setToken as saveToken } from "@/lib/auth";

type HealthResponse = {
  status?: string;
  db?: string;
};

type VersionResponse = {
  name?: string;
  version?: string;
  commit?: string;
  builtAt?: string;
};

function formatUnknown(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function ApiTestPage() {
  const isProduction = process.env.NODE_ENV === "production";
  const [tokenInputKey, setTokenInputKey] = useState<number>(0);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string>("");
  const [version, setVersion] = useState<VersionResponse | null>(null);
  const [versionError, setVersionError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [tradesJSON, setTradesJSON] = useState<string>("");
  const [tradesError, setTradesError] = useState<string>("");
  const [loadingTrades, setLoadingTrades] = useState<boolean>(false);
  const [meJSON, setMeJSON] = useState<string>("");
  const [meError, setMeError] = useState<string>("");
  const [loadingMe, setLoadingMe] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    async function loadHealth() {
      try {
        const [healthData, versionData] = await Promise.all([
          apiFetch<HealthResponse>("/health"),
          apiFetch<VersionResponse>("/version"),
        ]);
        if (!cancelled) {
          setHealth(healthData);
          setVersion(versionData);
        }
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }
        if (error instanceof ApiError) {
          setHealthError(error.message);
          setVersionError(error.message);
          return;
        }
        setHealthError("Unable to load health endpoint");
        setVersionError("Unable to load version endpoint");
      }
    }
    void loadHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onLoadTrades() {
    if (isProduction) {
      return;
    }
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

  async function onLoadMe() {
    if (isProduction) {
      return;
    }
    setLoadingMe(true);
    setMeError("");
    setMeJSON("");

    const rawToken = token.trim();
    if (!rawToken) {
      setMeError("Missing token");
      setLoadingMe(false);
      return;
    }

    try {
      const data = await fetchAuthMe(rawToken);
      setMeJSON(formatUnknown(data));
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setMeError(`${error.message} (${error.status})`);
        if (error.payload !== undefined) {
          setMeJSON(formatUnknown(error.payload));
        }
      } else {
        setMeError("Unable to load /v1/auth/me");
      }
    } finally {
      setLoadingMe(false);
    }
  }

  function onSaveToken() {
    if (isProduction) {
      return;
    }
    if (!token.trim()) {
      return;
    }
    saveToken(token.trim());
  }

  function onClearToken() {
    if (isProduction) {
      return;
    }
    clearToken();
    setToken("");
    setTokenInputKey((prev) => prev + 1);
  }

  return (
    <main>
      <h1>API Test</h1>
      {isProduction ? (
        <p className="muted">
          Production mode: diagnostic page is read-only (health/version only).
        </p>
      ) : null}

      <section>
        <h2>Health</h2>
        {healthError ? (
          <p>{healthError}</p>
        ) : (
          <p>
            status: {health?.status ?? "-"} / db: {health?.db ?? "-"}
          </p>
        )}
        {versionError ? (
          <p>{versionError}</p>
        ) : (
          <p>
            version: {version?.version ?? "-"} / commit: {version?.commit ?? "-"} / builtAt:{" "}
            {version?.builtAt ?? "-"}
          </p>
        )}
      </section>

      {!isProduction ? (
        <section>
          <h2>Trades</h2>
          <TokenInput key={tokenInputKey} id="api-test-token" onTokenChange={setToken} />
          {token.trim() ? <p>Token ok</p> : <p>No token</p>}
          <button type="button" onClick={onSaveToken} disabled={!token.trim()}>
            Save token
          </button>
          <button type="button" onClick={onClearToken}>
            Clear token
          </button>
          <button type="button" onClick={() => void onLoadTrades()} disabled={loadingTrades}>
            {loadingTrades ? "Loading..." : "Load trades"}
          </button>
          <button type="button" onClick={() => void onLoadMe()} disabled={loadingMe}>
            {loadingMe ? "Loading..." : "Load me"}
          </button>
          {tradesError ? <p>{tradesError}</p> : null}
          {tradesJSON ? <pre>{tradesJSON}</pre> : null}
          {meError ? <p>{meError}</p> : null}
          {meJSON ? <pre>{meJSON}</pre> : null}
        </section>
      ) : null}
    </main>
  );
}
