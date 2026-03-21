"use client";

import { useRef, useState } from "react";
import { useMt5Import } from "@/features/mt5/hooks";
import { useMt5Status } from "@/features/mt5/hooks";
import { useProAnalysisTrades } from "@/features/pro-analysis/hooks";
import styles from "@/features/mt5/ui/mt5.module.css";

export function Mt5ImportCard() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const { upload, loading, error, result } = useMt5Import();
  const { data: statusData } = useMt5Status();
  const { data: tradesData } = useProAnalysisTrades(500);
  const inputRef = useRef<HTMLInputElement>(null);

  const importedCount: number | null = (() => {
    const r = result as Record<string, unknown> | null | undefined;
    if (r && typeof r === "object" && "inserted" in r) {
      const n = Number(r.inserted);
      return Number.isNaN(n) ? null : n;
    }
    return null;
  })();

  const onUpload = async () => {
    if (!file) return;
    await upload(file);
    setFile(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".csv")) setFile(f);
  };

  // Stats from real data
  const totalTrades = statusData?.total_trades ?? tradesData?.trades?.length ?? 0;
  const trades = tradesData?.trades ?? [];
  const uniqueSymbols = new Set(trades.map((t) => t.symbol)).size;

  const periodDays = (() => {
    if (trades.length < 2) return null;
    const sorted = [...trades]
      .filter((t) => t.closed_at)
      .sort((a, b) => new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime());
    if (sorted.length < 2) return null;
    const diff = new Date(sorted[sorted.length - 1].closed_at!).getTime() - new Date(sorted[0].closed_at!).getTime();
    return Math.round(diff / 86400_000);
  })();

  return (
    <>
      {/* ── Import CSV card ── */}
      <div className={styles.importCard}>
        <div>
          <div className={styles.importTitle}>Import CSV MT5</div>
          <div className={styles.importSubtitle}>
            Importe tes trades depuis l&apos;historique MetaTrader 5 au format CSV.
          </div>
        </div>

        {/* Dropzone */}
        <div
          className={styles.dropzone}
          data-dragover={dragOver}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className={styles.dropzoneIcon}>↑</div>
          {file ? (
            <span className={styles.fileSelected}>{file.name}</span>
          ) : (
            <>
              <span className={styles.dropzoneTitle}>Glisse un fichier CSV ici</span>
              <span className={styles.dropzoneSub}>ou clique pour sélectionner</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            className={styles.importBtn}
            onClick={() => void onUpload()}
            disabled={!file || loading}
          >
            {loading ? "Import en cours…" : "Importer"}
          </button>
          {file && !loading && (
            <button
              style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid var(--ui-color-border)", background: "transparent", color: "var(--ui-color-muted)", cursor: "pointer", fontSize: "0.84rem" }}
              onClick={() => setFile(null)}
            >
              Annuler
            </button>
          )}
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}
        {importedCount !== null && (
          <p className={styles.successMsg}>✓ {importedCount} trades importés avec succès</p>
        )}
      </div>

      {/* ── Bottom row ── */}
      <div className={styles.bottomRow}>
        {/* How to export */}
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

        {/* Données importées */}
        <div className={styles.dataCard}>
          <h3 className={styles.dataTitle}>Données importées</h3>
          <div className={styles.dataRow}>
            <span className={styles.dataKey}>Trades totaux</span>
            <span className={styles.dataVal}>{totalTrades || "—"}</span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataKey}>Période couverte</span>
            <span className={styles.dataVal}>{periodDays ? `${periodDays} jours` : "—"}</span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataKey}>Paires de devises</span>
            <span className={styles.dataVal}>{uniqueSymbols || "—"}</span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataKey}>Statut</span>
            <span className={styles.dataValGreen}>
              {totalTrades > 0 ? "✓ Synchronisé" : "En attente"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
