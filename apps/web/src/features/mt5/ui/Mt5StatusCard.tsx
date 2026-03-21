"use client";

import { useMt5Status } from "@/features/mt5/hooks";
import styles from "@/features/mt5/ui/mt5.module.css";

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmtTime(d: string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function timeSince(d: string | null | undefined): string {
  if (!d) return "jamais";
  const secs = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (secs < 60) return "à l'instant";
  if (secs < 3600) return `${Math.floor(secs / 60)} minutes ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} hours ago`;
  return `${Math.floor(secs / 86400)} days ago`;
}

function nextSync(d: string | null | undefined): string {
  if (!d) return "—";
  const next = new Date(new Date(d).getTime() + 60 * 60 * 1000);
  const diff = Math.max(0, Math.floor((next.getTime() - Date.now()) / 60000));
  if (diff <= 0) return "Maintenant";
  return `In ${diff} minutes`;
}

export function Mt5StatusCard() {
  const { data, loading, error, refresh } = useMt5Status();

  const totalTrades = data?.total_trades ?? 0;
  const importStatus = data?.last_import_status ?? null;
  const lastImport = data?.last_imported_at ?? null;
  const accountId = data?.account_id ?? null;
  const isConnected = importStatus === "ok" || (totalTrades > 0);

  return (
    <div className={styles.statusCard}>
      {/* Header */}
      <div className={styles.statusCardHeader}>
        <h2 className={styles.statusCardTitle}>Connection Status</h2>
        <div className={styles.statusCardRight}>
          {lastImport && (
            <span className={styles.lastSync}>
              🕐 Last sync: <strong>{timeSince(lastImport)}</strong>
            </span>
          )}
          <span className={styles.autoSyncBadge}>
            <span className={styles.autoSyncDot} />
            Auto-sync: enabled
          </span>
        </div>
      </div>

      {/* Metrics */}
      {loading ? (
        <div className={styles.metricsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.metricBox}>
              <div className={styles.skeletonLine} style={{ width: "60%" }} />
              <div className={styles.skeletonLine} style={{ width: "40%", height: 28 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.metricsGrid}>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Total trades</span>
            <span className={styles.metricValue} data-cyan="true">{totalTrades}</span>
            <span className={styles.metricSub}>{totalTrades} trades importés</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Status</span>
            <span
              className={styles.metricValue}
              data-cyan="true"
              style={{ color: isConnected ? "var(--ui-color-primary)" : "#ff4466" }}
            >
              {isConnected ? "Connected" : error ? "Error" : "Pending"}
            </span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Last import</span>
            <span className={styles.metricValue} style={{ fontSize: "1.05rem" }}>
              {fmtDate(lastImport)}
            </span>
            {lastImport && <span className={styles.metricSub}>{fmtTime(lastImport)}</span>}
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Next sync</span>
            <span className={styles.metricValue} style={{ fontSize: "1.05rem" }}>
              {nextSync(lastImport)}
            </span>
          </div>
        </div>
      )}

      {/* Account ID */}
      {accountId && (
        <div className={styles.accountIdBox}>
          <span className={styles.accountIdLabel}>Account ID</span>
          <span className={styles.accountIdValue}>{accountId}</span>
        </div>
      )}

      {/* Refresh */}
      <button
        className={styles.refreshBtn}
        onClick={() => void refresh()}
        disabled={loading}
      >
        {loading ? "…" : "↻"} Refresh Now
      </button>
    </div>
  );
}
