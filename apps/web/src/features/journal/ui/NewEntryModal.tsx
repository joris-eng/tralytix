"use client";

import { useState } from "react";
import type { CreateEntryPayload, JournalEntry } from "@/features/journal/model/types";
import { TIMEFRAMES, EMOTION_OPTIONS } from "@/features/journal/model/types";
import { useCreateEntry } from "@/features/journal/hooks/useJournal";
import styles from "@/features/journal/ui/journal.module.css";

interface Props {
  onClose: () => void;
  onCreated: (entry: JournalEntry) => void;
}

const today = new Date().toISOString().slice(0, 10);

const EMPTY: CreateEntryPayload = {
  symbol: "",
  side: "LONG",
  timeframe: "H4",
  entry_price: 0,
  close_price: 0,
  profit: 0,
  opened_at: today,
  setup: "",
  emotions: [],
  notes: "",
  lessons: "",
};

export function NewEntryModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateEntryPayload>(EMPTY);
  const { create, loading, error } = useCreateEntry();

  const set = <K extends keyof CreateEntryPayload>(key: K, val: CreateEntryPayload[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const toggleEmotion = (e: string) =>
    set(
      "emotions",
      form.emotions.includes(e)
        ? form.emotions.filter((x) => x !== e)
        : [...form.emotions, e]
    );

  const handleSubmit = async () => {
    const entry = await create(form);
    if (entry) {
      onCreated(entry);
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Nouvelle entrée</h2>

        <div className={styles.formGrid}>
          {/* Symbol */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Paire</label>
            <input
              className={styles.formInput}
              placeholder="EUR/USD"
              value={form.symbol}
              onChange={(e) => set("symbol", e.target.value.toUpperCase())}
            />
          </div>

          {/* Side */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Direction</label>
            <select
              className={styles.formSelect}
              value={form.side}
              onChange={(e) => set("side", e.target.value as "LONG" | "SHORT")}
            >
              <option value="LONG">LONG</option>
              <option value="SHORT">SHORT</option>
            </select>
          </div>

          {/* Date */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Date</label>
            <input
              type="date"
              className={styles.formInput}
              value={form.opened_at}
              onChange={(e) => set("opened_at", e.target.value)}
            />
          </div>

          {/* Timeframe */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Timeframe</label>
            <select
              className={styles.formSelect}
              value={form.timeframe}
              onChange={(e) => set("timeframe", e.target.value)}
            >
              {TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </div>

          {/* Entry price */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Prix d&apos;entrée</label>
            <input
              type="number"
              step="0.00001"
              className={styles.formInput}
              value={form.entry_price || ""}
              onChange={(e) => set("entry_price", parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Close price */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Prix de sortie</label>
            <input
              type="number"
              step="0.00001"
              className={styles.formInput}
              value={form.close_price || ""}
              onChange={(e) => set("close_price", parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Profit */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Résultat ($)</label>
            <input
              type="number"
              step="0.01"
              className={styles.formInput}
              value={form.profit || ""}
              onChange={(e) => set("profit", parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Setup */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Setup</label>
            <input
              className={styles.formInput}
              placeholder="ex: Breakout de résistance"
              value={form.setup}
              onChange={(e) => set("setup", e.target.value)}
            />
          </div>

          {/* Emotions */}
          <div className={`${styles.formField} ${styles.fullWidth}`}>
            <label className={styles.formLabel}>État émotionnel</label>
            <div className={styles.emotionPicker}>
              {EMOTION_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={styles.emotionPickerItem}
                  data-selected={form.emotions.includes(e)}
                  onClick={() => toggleEmotion(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className={`${styles.formField} ${styles.fullWidth}`}>
            <label className={styles.formLabel}>Notes</label>
            <textarea
              className={styles.formTextarea}
              placeholder="Détails sur l'exécution du trade..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          {/* Lessons */}
          <div className={`${styles.formField} ${styles.fullWidth}`}>
            <label className={styles.formLabel}>Leçons apprises</label>
            <textarea
              className={styles.formTextarea}
              placeholder="Qu'est-ce que ce trade t'a appris ?"
              value={form.lessons}
              onChange={(e) => set("lessons", e.target.value)}
            />
          </div>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        <div className={styles.modalActions}>
          <button className={styles.btnGhost} onClick={onClose} disabled={loading}>
            Annuler
          </button>
          <button className={styles.btnPrimary} onClick={() => void handleSubmit()} disabled={loading || !form.symbol}>
            {loading ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
