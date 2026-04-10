"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/shared/contexts/LanguageContext";
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
  return new Date(d).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MT5Screen() {
  useLanguage();

  const [status] = useState({
    accountId: "mock-account-dev-123",
    totalTrades: 150,
    status: "connected",
    lastImport: new Date().toISOString(),
    lastImportDate: new Date().toISOString(),
    nextSync: "In 58 minutes",
    autoSyncEnabled: true,
    periodCovered: 90,
    currencyPairs: 12,
  });

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".csv")) setFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setImportResult(42);
    setFile(null);
    setImporting(false);
  };

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div>
        <h1 className={styles.pageTitle}>Connexion MT5</h1>
        <p className={styles.pageSubtitle}>
          Importez vos données de trading depuis MetaTrader 5.
        </p>
      </div>

      {/* Status card */}
      <div className={styles.statusCard}>
        <div className={styles.statusCardHeader}>
          <h2 className={styles.statusCardTitle}>Connection Status</h2>
          <div className={styles.statusCardRight}>
            <span className={styles.lastSync}>
              🕐 Last sync: <strong>à l&apos;instant</strong>
            </span>
            <span className={styles.autoSyncBadge}>
              <span className={styles.autoSyncDot} />
              Auto-sync: enabled
            </span>
          </div>
        </div>

        <div className={styles.metricsGrid}>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Total trades</span>
            <span className={styles.metricValue} data-cyan="true">
              {status.totalTrades}
            </span>
            <span className={styles.metricSub}>
              {status.totalTrades} trades importés
            </span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Status</span>
            <span
              className={styles.metricValue}
              data-cyan="true"
              style={{ color: "var(--ui-color-primary)" }}
            >
              Connected
            </span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Last import</span>
            <span
              className={styles.metricValue}
              style={{ fontSize: "1.05rem" }}
            >
              {fmtDate(status.lastImportDate)}
            </span>
            <span className={styles.metricSub}>
              {fmtTime(status.lastImportDate)}
            </span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Next sync</span>
            <span
              className={styles.metricValue}
              style={{ fontSize: "1.05rem" }}
            >
              {status.nextSync}
            </span>
          </div>
        </div>

        <div className={styles.accountIdBox}>
          <span className={styles.accountIdLabel}>Account ID</span>
          <span className={styles.accountIdValue}>{status.accountId}</span>
        </div>
      </div>

      {/* Import CSV card */}
      <div className={styles.importCard}>
        <div>
          <div className={styles.importTitle}>Import CSV MT5</div>
          <div className={styles.importSubtitle}>
            Importe tes trades depuis l&apos;historique MetaTrader 5 au format
            CSV.
          </div>
        </div>

        <div
          className={styles.dropzone}
          data-dragover={dragOver}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className={styles.dropzoneIcon}>↑</div>
          {file ? (
            <span className={styles.fileSelected}>{file.name}</span>
          ) : (
            <>
              <span className={styles.dropzoneTitle}>
                Glisse un fichier CSV ici
              </span>
              <span className={styles.dropzoneSub}>
                ou clique pour sélectionner
              </span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFile(f);
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.8rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            className={styles.importBtn}
            onClick={() => void handleImport()}
            disabled={!file || importing}
          >
            {importing ? "Import en cours…" : "Importer"}
          </button>
          {file && !importing && (
            <button
              style={{
                padding: "0.6rem 1rem",
                borderRadius: 8,
                border: "1px solid var(--ui-color-border)",
                background: "transparent",
                color: "var(--ui-color-muted)",
                cursor: "pointer",
                fontSize: "0.84rem",
              }}
              onClick={() => setFile(null)}
            >
              Annuler
            </button>
          )}
        </div>

        {importResult !== null && (
          <p className={styles.successMsg}>
            ✓ {importResult} trades importés avec succès
          </p>
        )}
      </div>

      {/* Bottom info cards */}
      <div className={styles.bottomRow}>
        <div className={styles.helpCard}>
          <h3 className={styles.helpTitle}>Comment exporter depuis MT5?</h3>
          <ul className={styles.helpList}>
            {[
              'Ouvrir l\'onglet "Historique du compte" dans MT5',
              'Faire un clic droit et sélectionner "Enregistrer comme rapport"',
              "Choisir le format CSV et enregistrer le fichier",
              "Importer le fichier ici pour l'analyse",
            ].map((step, i) => (
              <li key={i} className={styles.helpItem}>
                <span className={styles.helpDot} />
                {step}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.dataCard}>
          <h3 className={styles.dataTitle}>Données importées</h3>
          <div className={styles.dataRow}>
            <span className={styles.dataKey}>Trades totaux</span>
            <span className={styles.dataVal}>{status.totalTrades}</span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataKey}>Période couverte</span>
            <span className={styles.dataVal}>
              {status.periodCovered} jours
            </span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataKey}>Paires de devises</span>
            <span className={styles.dataVal}>{status.currencyPairs}</span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataKey}>Statut</span>
            <span className={styles.dataValGreen}>✓ Synchronisé</span>
          </div>
        </div>
      </div>
    </div>
  );
}
