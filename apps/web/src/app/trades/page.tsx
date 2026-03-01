"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { isUnauthorized } from "@/lib/apiErrors";
import { AuthGate } from "@/shared/auth/AuthGate";
import { useRequireAuth } from "@/shared/auth/useSessionState";

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
  const router = useRouter();
  const { isAuthenticated, checkingSession } = useRequireAuth(router);
  const [loading, setLoading] = useState<boolean>(true);
  const [state, setState] = useState<"ok" | "error">("ok");
  const [tradesJSON, setTradesJSON] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorPayload, setErrorPayload] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function loadTrades() {
      if (!isAuthenticated) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      const token = getToken();
      if (!token) {
        if (!cancelled) {
          clearToken();
          router.replace("/login");
          setLoading(false);
        }
        return;
      }

      try {
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
          router.replace("/login");
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
  }, [isAuthenticated, router]);

  return (
    <AuthGate checkingSession={checkingSession} isAuthenticated={isAuthenticated}>
      <main>
        <h1>Trades</h1>
        {loading ? <p>Loading...</p> : null}
        {!loading && state === "error" ? <p>{errorMessage}</p> : null}
        {!loading && state === "error" && errorPayload ? <pre>{errorPayload}</pre> : null}
        {!loading && state === "ok" ? <pre>{tradesJSON}</pre> : null}
      </main>
    </AuthGate>
  );
}
