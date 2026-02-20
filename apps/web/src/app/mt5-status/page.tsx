"use client";

import Link from "next/link";
import { useMt5Status } from "@/hooks/useMt5Status";

export default function Mt5StatusPage() {
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
      {error ? <p className="error">{error}</p> : null}
      {!loading && !error && data ? (
        <pre style={{ overflowX: "auto" }}>{JSON.stringify(data, null, 2)}</pre>
      ) : null}
    </section>
  );
}

