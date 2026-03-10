"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/shared/api/apiClient";
import { Skeleton } from "@/features/ui/primitives";
import styles from "@/features/mt5/ui/mt5.module.css";

const STEPS = [
  "Dans MT5 : Outils → Options → Expert Advisors",
  'Coche "Allow WebRequest for listed URL:"',
  "Ajoute l'URL : https://tralytix.onrender.com",
  "Télécharge TralytixSync.mq5 et copie-le dans MQL5/Experts/",
  "Attache l'EA sur un graphique (ex: EURUSD M1)",
  'Colle ton token ci-dessous dans le champ "TralytixToken"',
  'Active "AutoTrading" dans la barre d\'outils MT5',
];

export function Mt5EASetupCard() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiClient
      .mt5EAToken()
      .then((res) => setToken(res.token))
      .catch(() => setError("Impossible de charger le token EA."))
      .finally(() => setLoading(false));
  }, []);

  const copyToken = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.importCard}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className={styles.importTitle}>Connexion Live MT5</div>
          <div className={styles.importSubtitle}>
            Installe l&apos;Expert Advisor pour synchroniser tes trades en temps réel.
          </div>
        </div>
        <span style={{
          fontFamily: "var(--ui-font-mono)",
          fontSize: "10px",
          padding: "3px 10px",
          borderRadius: "var(--ui-radius-pill)",
          background: "rgba(255, 181, 71, 0.12)",
          color: "var(--ui-color-warning)",
          border: "1px solid rgba(255, 181, 71, 0.25)",
        }}>
          Beta
        </span>
      </div>

      {/* Steps */}
      <ol style={{ margin: 0, padding: 0, display: "grid", gap: 8, listStyle: "none" }}>
        {STEPS.map((step, i) => (
          <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{
              flexShrink: 0,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "var(--ui-color-surface-elevated)",
              border: "1px solid var(--ui-color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--ui-font-mono)",
              fontSize: "10px",
              color: "var(--ui-color-primary)",
              fontWeight: 600,
            }}>
              {i + 1}
            </span>
            <span style={{
              fontFamily: "var(--ui-font-mono)",
              fontSize: "var(--ui-font-size-sm)",
              color: "var(--ui-color-text-muted)",
              lineHeight: 1.5,
              paddingTop: 2,
            }}>
              {step}
            </span>
          </li>
        ))}
      </ol>

      {/* Token */}
      <div style={{
        background: "var(--ui-color-surface-elevated)",
        border: "1px solid var(--ui-color-border)",
        borderRadius: "var(--ui-radius-sm)",
        padding: "var(--ui-space-3) var(--ui-space-4)",
      }}>
        <div style={{
          fontFamily: "var(--ui-font-mono)",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--ui-color-text-subtle)",
          marginBottom: 8,
        }}>
          Ton token EA
        </div>

        {loading ? (
          <Skeleton height={18} />
        ) : error ? (
          <span style={{ fontFamily: "var(--ui-font-mono)", fontSize: "var(--ui-font-size-sm)", color: "var(--ui-color-danger)" }}>
            {error}
          </span>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <code style={{
              fontFamily: "var(--ui-font-mono)",
              fontSize: "var(--ui-font-size-sm)",
              color: "var(--ui-color-primary)",
              wordBreak: "break-all",
              flex: 1,
            }}>
              {token}
            </code>
            <button
              className="ui-button"
              data-variant="ghost"
              onClick={() => void copyToken()}
              style={{ flexShrink: 0, fontSize: "var(--ui-font-size-xs)" }}
            >
              {copied ? "✓ Copié" : "Copier"}
            </button>
          </div>
        )}
      </div>

      {/* Download */}
      <div className={styles.importActions}>
        <a
          href="https://raw.githubusercontent.com/joris-eng/tralytix/main/ea/TralytixSync.mq5"
          download="TralytixSync.mq5"
          className="ui-button"
          data-variant="primary"
          style={{ textDecoration: "none", display: "inline-block" }}
        >
          ↓ Télécharger TralytixSync.mq5
        </a>
      </div>
    </div>
  );
}
