"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import { fetchAuthMe } from "@/lib/authApi";
import { clearToken, getToken } from "@/lib/auth";
import { isUnauthorized } from "@/lib/apiErrors";

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
  const [loading, setLoading] = useState<boolean>(true);
  const [state, setState] = useState<"missing-token" | "ok" | "expired" | "error">("ok");
  const [tradesJSON, setTradesJSON] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorPayload, setErrorPayload] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function loadTrades() {
      const token = getToken();
      if (!token) {
        if (!cancelled) {
          setState("missing-token");
          setLoading(false);
        }
        return;
      }

      try {
        await fetchAuthMe(token);
        if (cancelled) {
          return;
        }

        const data = await apiFetch<TradesResponse>("/v1/trades", { token });
        if (cancelled) {
          return;
        }
        setTradesJSON(formatUnknown(data));
        setState("ok");
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }
        if (isUnauthorized(error)) {
          clearToken();
          setState("expired");
          setErrorMessage("Session expirée, reconnecte-toi");
          setLoading(false);
          return;
        }
        if (error instanceof ApiError) {
          setState("error");
          setErrorMessage(`Error ${error.status}: ${error.message}`);
          if (error.payload !== undefined) {
            setErrorPayload(formatUnknown(error.payload));
          }
        } else {
          setState("error");
          setErrorMessage("Unable to load trades");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTrades();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <h1>Trades</h1>
      {loading ? <p>Loading...</p> : null}
      {!loading && state === "missing-token" ? (
        <p>
          Token manquant, va sur /login. <Link href="/login">Go to login</Link>
        </p>
      ) : null}
      {!loading && state === "expired" ? (
        <p>
          Session expirée, reconnecte-toi. <Link href="/login">Go to login</Link>
        </p>
      ) : null}
      {!loading && state === "error" ? <p>{errorMessage}</p> : null}
      {!loading && state === "error" && errorPayload ? <pre>{errorPayload}</pre> : null}
      {!loading && state === "ok" ? <pre>{tradesJSON}</pre> : null}
    </main>
  );
}
