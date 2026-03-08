"use client";

import { useRef, useState } from "react";
import { useMt5Import } from "@/features/mt5/hooks";
import styles from "@/features/mt5/ui/mt5.module.css";

export function Mt5ImportCard() {
  const [file, setFile] = useState<File | null>(null);
  const { upload, loading, error, result } = useMt5Import();
  const inputRef = useRef<HTMLInputElement>(null);

  const onUpload = async () => {
    if (!file) return;
    await upload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.endsWith(".csv")) setFile(dropped);
  };

  const importedCount: number | null =
    typeof result === "object" && result !== null && "inserted" in result
      ? Number((result as Record<string, unknown>).inserted)
      : null;

  return (
    <div className={styles.importCard}>
      <div className={styles.importTitle}>Import CSV MT5</div>
      <div className={styles.importSubtitle}>
        Importe tes trades depuis l'historique MetaTrader 5 au format CSV.
      </div>

      {/* Dropzone */}
      <label
        className={styles.importDropzone}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <span className={styles.dropzoneIcon}>📂</span>
        {file ? (
          <span className={styles.fileSelected}>✓ {file.name}</span>
        ) : (
          <>
            <span className={styles.dropzoneLabel}>Glisse un fichier CSV ici</span>
            <span className={styles.dropzoneHint}>ou clique pour sélectionner</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className={styles.hiddenInput}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <div className={styles.importActions}>
        <button
          className="ui-button"
          data-variant="primary"
          onClick={() => void onUpload()}
          disabled={!file || loading}
        >
          {loading ? "Import en cours…" : "Importer"}
        </button>
        {file && (
          <button
            className="ui-button"
            data-variant="ghost"
            onClick={() => setFile(null)}
            disabled={loading}
          >
            Annuler
          </button>
        )}
      </div>

      {error && (
        <p style={{
          marginTop: "var(--ui-space-3)",
          fontFamily: "var(--ui-font-mono)",
          fontSize: "var(--ui-font-size-sm)",
          color: "var(--ui-color-danger)"
        }}>
          {error}
        </p>
      )}

      {result !== null && result !== undefined && !error && (
        <div className={styles.importResult}>
          {importedCount !== null && !Number.isNaN(importedCount)
            ? `✓ ${importedCount} trades importés avec succès.`
            : "✓ Import terminé."}
        </div>
      )}
    </div>
  );
}
