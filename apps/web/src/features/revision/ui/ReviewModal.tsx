"use client";

import { useState, useRef } from "react";
import type { TradeWithReview, UpsertReviewPayload } from "@/features/revision/model/types";
import { SETUP_TAGS } from "@/features/revision/model/types";
import { useUpsertReview } from "@/features/revision/hooks/useRevision";
import styles from "@/features/revision/ui/revision.module.css";

interface Props {
  trade: TradeWithReview;
  onClose: () => void;
  onSaved: () => void;
}

export function ReviewModal({ trade, onClose, onSaved }: Props) {
  const existing = trade.review;
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [setupTag, setSetupTag] = useState(existing?.setup_tag ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [learnings, setLearnings] = useState<string[]>(existing?.key_learnings ?? []);
  const [newLearning, setNewLearning] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { upsert, loading, error } = useUpsertReview();

  const addLearning = () => {
    const val = newLearning.trim();
    if (val && !learnings.includes(val)) {
      setLearnings((l) => [...l, val]);
    }
    setNewLearning("");
    inputRef.current?.focus();
  };

  const removeLearning = (idx: number) =>
    setLearnings((l) => l.filter((_, i) => i !== idx));

  const handleSave = async () => {
    const payload: UpsertReviewPayload = { rating, setup_tag: setupTag, notes, key_learnings: learnings };
    const saved = await upsert(trade.trade_id, payload);
    if (saved) {
      onSaved();
      onClose();
    }
  };

  const displaySide = trade.side === "BUY" ? "Long" : "Short";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {trade.symbol} · {displaySide}
          </h2>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>

        {/* Rating */}
        <div className={styles.ratingSection}>
          <div className={styles.ratingLabel}>Note d&apos;exécution</div>
          <div className={styles.ratingPicker}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={styles.ratingDot}
                data-filled={n <= rating}
                onClick={() => setRating(n === rating ? 0 : n)}
                aria-label={`Note ${n}`}
              />
            ))}
          </div>
        </div>

        {/* Setup tag */}
        <div className={styles.formField}>
          <label className={styles.formLabel}>Setup</label>
          <select
            className={styles.formSelect}
            value={setupTag}
            onChange={(e) => setSetupTag(e.target.value)}
          >
            <option value="">— Choisir un setup —</option>
            {SETUP_TAGS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className={styles.formField}>
          <label className={styles.formLabel}>Notes</label>
          <textarea
            className={styles.formTextarea}
            placeholder="Qu'est-ce qui s'est passé sur ce trade ?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Key learnings */}
        <div className={styles.formField}>
          <label className={styles.formLabel}>Key Learnings</label>
          <div className={styles.learningsInputRow}>
            <input
              ref={inputRef}
              className={styles.formInput}
              placeholder="Ajouter un apprentissage…"
              value={newLearning}
              onChange={(e) => setNewLearning(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addLearning(); }
              }}
            />
            <button
              type="button"
              className={styles.btnGhost}
              onClick={addLearning}
              disabled={!newLearning.trim()}
            >
              +
            </button>
          </div>
          {learnings.length > 0 && (
            <div className={styles.learningChips}>
              {learnings.map((l, i) => (
                <div key={i} className={styles.learningChip}>
                  <span>→ {l}</span>
                  <button
                    type="button"
                    className={styles.learningChipRemove}
                    onClick={() => removeLearning(i)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        <div className={styles.modalActions}>
          <button className={styles.btnGhost} onClick={onClose} disabled={loading}>
            Annuler
          </button>
          <button className={styles.btnPrimary} onClick={() => void handleSave()} disabled={loading}>
            {loading ? "Enregistrement…" : existing ? "Mettre à jour" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
