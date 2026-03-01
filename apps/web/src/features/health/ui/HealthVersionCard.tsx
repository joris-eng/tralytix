"use client";

import { useHealthVersion } from "@/features/health/hooks";
import { ApiError } from "@/shared/ui/ApiError";
import { JsonBlock } from "@/shared/ui/JsonBlock";

function formatBuiltAt(value?: string): string {
  if (!value || value === "unknown") {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function shortCommit(value?: string): string {
  if (!value || value === "dev") {
    return "-";
  }
  return value.slice(0, 7);
}

export function HealthVersionCard() {
  const { health, version, loading, error, refresh } = useHealthVersion();

  return (
    <section className="card">
      <h2>Health & Version</h2>
      {version ? (
        <p className="muted">
          API {version.name} v{version.version} | commit {shortCommit(version.commit)} | built{" "}
          {formatBuiltAt(version.builtAt)}
        </p>
      ) : null}
      <button className="primary" onClick={() => void refresh()} disabled={loading}>
        {loading ? "Loading..." : "Refresh"}
      </button>
      {error ? <ApiError message={error} /> : null}
      {health ? <JsonBlock value={{ health, version }} /> : null}
    </section>
  );
}

