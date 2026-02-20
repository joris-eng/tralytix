"use client";

import Link from "next/link";
import { useAuthGuard } from "@/shared/auth/useAuthGuard";
import { useMt5Status } from "@/features/mt5/hooks";
import { ApiError } from "@/shared/ui/ApiError";
import { JsonBlock } from "@/shared/ui/JsonBlock";

export default function Mt5StatusPage() {
  const { isAuthenticated } = useAuthGuard();
  const { data, error, loading, refresh } = useMt5Status();
  if (!isAuthenticated) {
    return <p className="muted">Redirecting to login...</p>;
  }

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

