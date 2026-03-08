"use client";

import { useMt5Status } from "@/features/mt5/hooks";
import { Skeleton } from "@/features/ui/primitives";
import styles from "@/features/mt5/ui/mt5.module.css";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusLabel(status: string | undefined): string {
  if (status === "ok") return "Connecté";
  if (status === "idle") return "En attente";
  return "Erreur";
}

function statusKey(status: string | undefined): string {
  if (status === "ok") return "ok";
  if (status === "idle") return "idle";
  return "error";
}

export function Mt5StatusCard() {
  const { data, loading, error, refresh } = useMt5Status();

  const account = data?.account_id ?? data?.AccountID;
  const totalTrades = data?.total_trades ?? data?.TotalTrades ?? 0;
  const importStatus = data?.last_import_status ?? data?.LastImportStatus;
  const importedAt = data?.last_imported_at ?? data?.LastImportedAt;

  return (
    <div className={styles.statusCard}>
      <div className={styles.statusHeader}>
        <span className={styles.statusLabel}>Compte MT5</span>
        {data && !loading && (
          <span className={styles.statusBadge} data-status={statusKey(importStatus)}>
            <span className={styles.statusDot} />
            {statusLabel(importStatus)}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: 12 }}>
          <Skeleton height={20} />
          <Skeleton height={20} width="70%" />
        </div>
      ) : error ? (
        <p style={{ fontFamily: "var(--ui-font-mono)", fontSize: "var(--ui-font-size-sm)", color: "var(--ui-color-danger)" }}>
          {error}
        </p>
      ) : data ? (
        <>
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Trades</span>
              <span className={styles.metricValue} data-accent="primary">{totalTrades}</span>
              <span className={styles.metricSub}>historique complet</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Statut import</span>
              <span className={styles.metricValue} style={{ fontSize: "1rem", marginTop: 4 }}>
                {statusLabel(importStatus)}
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Dernier import</span>
              <span className={styles.metricValue} style={{ fontSize: "0.85rem", marginTop: 4 }}>
                {formatDate(importedAt)}
              </span>
            </div>
          </div>

          {account && (
            <div className={styles.accountId}>
              <span className={styles.accountIdLabel}>Account ID</span>
              {account}
            </div>
          )}
        </>
      ) : null}

      <div style={{ marginTop: "var(--ui-space-4)" }}>
        <button
          className="ui-button"
          data-variant="ghost"
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ? "Chargement…" : "↻ Rafraîchir"}
        </button>
      </div>
    </div>
  );
}
