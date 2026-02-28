"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMt5Status } from "@/features/mt5/hooks";
import { ApiError } from "@/shared/ui/ApiError";
import { JsonBlock } from "@/shared/ui/JsonBlock";
import { fetchAuthMe } from "@/lib/authApi";
import { clearToken, getToken } from "@/lib/auth";

function Mt5StatusContent() {
  const { data, error, loading, refresh } = useMt5Status();

  return (
    <section className="card">
      <h1>MT5 Status</h1>
      <p className="muted">Auto login dev + fetch status from backend `/v1`.</p>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="primary" onClick={() => void refresh()} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
        <Link href="/">Back Home</Link>
      </div>

      {loading ? <p className="muted">Loading status...</p> : null}
      {error ? <ApiError message={error} /> : null}
      {!loading && !error && data ? <JsonBlock value={data} /> : null}
    </section>
  );
}

export default function Mt5StatusPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        await fetchAuthMe(token);
        if (!cancelled) {
          setIsAuthenticated(true);
        }
      } catch {
        clearToken();
        router.replace("/login");
      }
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!isAuthenticated) {
    return <p className="muted">Redirecting to login...</p>;
  }

  return <Mt5StatusContent />;
}

