"use client";

import { useMemo, useState } from "react";
import type { JournalEntry } from "@/features/journal/model/types";
import { useJournalList, useDeleteEntry } from "@/features/journal/hooks/useJournal";
import { NewEntryModal } from "@/features/journal/ui/NewEntryModal";
import styles from "@/features/journal/ui/journal.module.css";

function fmtPnl(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}`;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── Trade detail panel ────────────────────────────────────────────

function TradeDetail({
  entry,
  onDelete,
}: {
  entry: JournalEntry;
  onDelete: (id: string) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Supprimer cette entrée ?")) return;
    setDeleting(true);
    await onDelete(entry.id);
    setDeleting(false);
  };

  return (
    <div className={styles.detailPanel}>
      {/* Header */}
      <div className={styles.detailHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <span className={styles.detailPair}>{entry.symbol}</span>
          <span className={styles.detailSideTag} data-side={entry.side}>{entry.side}</span>
        </div>
        <div className={styles.detailResult}>
          <div className={styles.detailResultLabel}>Résultat</div>
          <div
            className={styles.detailResultValue}
            data-sign={entry.profit >= 0 ? "pos" : "neg"}
          >
            {fmtPnl(entry.profit)}
          </div>
        </div>
      </div>

      <div className={styles.detailMeta}>
        <span>📅 {fmtDate(entry.opened_at)}</span>
        <span>⏱ {entry.timeframe}</span>
      </div>

      {/* Entry / Exit */}
      <div className={styles.priceRow}>
        <div className={styles.priceBox}>
          <div className={styles.priceBoxLabel}>
            <span>↗</span> Entry
          </div>
          <div className={styles.priceBoxValue}>{entry.entry_price.toFixed(4)}</div>
        </div>
        <div className={styles.priceBox}>
          <div className={styles.priceBoxLabel}>
            <span>↘</span> Exit
          </div>
          <div className={styles.priceBoxValue}>{entry.close_price.toFixed(4)}</div>
        </div>
      </div>

      {/* Setup */}
      {entry.setup && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>🏷 Setup</div>
          <div className={styles.detailSectionContent}>{entry.setup}</div>
        </div>
      )}

      {/* Emotions */}
      {entry.emotions.length > 0 && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>État émotionnel</div>
          <div className={styles.emotionTags}>
            {entry.emotions.map((e) => (
              <span key={e} className={styles.emotionTag}>{e}</span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {entry.notes && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>Notes</div>
          <div className={styles.detailSectionContent}>{entry.notes}</div>
        </div>
      )}

      {/* Lessons */}
      {entry.lessons && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>Leçons apprises</div>
          <div className={styles.lessonsBox}>{entry.lessons}</div>
        </div>
      )}

      <div className={styles.detailActions}>
        <button
          className={styles.btnGhost}
          onClick={() => void handleDelete()}
          disabled={deleting}
          style={{ color: "#ff4466", borderColor: "rgba(255,68,102,0.3)" }}
        >
          {deleting ? "Suppression…" : "🗑 Supprimer"}
        </button>
      </div>
    </div>
  );
}

// ─── Main screen ───────────────────────────────────────────────────

export function JournalScreen() {
  const { entries, stats, loading, error, refresh } = useJournalList();
  const { remove } = useDeleteEntry();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.symbol.toLowerCase().includes(q) ||
        e.setup.toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q) ||
        e.emotions.some((em) => em.toLowerCase().includes(q))
    );
  }, [entries, search]);

  const handleDelete = async (id: string) => {
    const ok = await remove(id);
    if (ok) {
      setSelected(null);
      await refresh();
    }
  };

  const handleCreated = async (entry: JournalEntry) => {
    await refresh();
    setSelected(entry);
  };

  const docRate = stats ? Math.round(stats.documentation_rate) : 0;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Journal de Trading</h1>
          <p className={styles.pageSubtitle}>
            Documente tes trades et identifie tes patterns de succès.
          </p>
        </div>
        <button className={styles.newBtn} onClick={() => setShowModal(true)}>
          + Nouvelle entrée
        </button>
      </div>

      {/* KPI stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard} data-color="green">
          <div className={styles.statLabel}>Entrées totales</div>
          <div className={styles.statValue}>{stats?.total_entries ?? "—"}</div>
        </div>
        <div className={styles.statCard} data-color="blue">
          <div className={styles.statLabel}>Setups documentés</div>
          <div className={styles.statValue}>{stats?.documented_setups ?? "—"}</div>
        </div>
        <div className={styles.statCard} data-color="purple">
          <div className={styles.statLabel}>Leçons apprises</div>
          <div className={styles.statValue}>{stats?.lessons_learned ?? "—"}</div>
        </div>
        <div className={styles.statCard} data-color="amber">
          <div className={styles.statLabel}>Taux de documentation</div>
          <div className={styles.statValue}>{stats ? `${docRate}%` : "—"}</div>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchWrapper}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.searchInput}
          placeholder="Rechercher par symbole, setup ou notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Split layout */}
      {error ? (
        <p style={{ color: "#ff4466" }}>{error}</p>
      ) : loading ? (
        <p style={{ color: "var(--ui-color-muted)" }}>Chargement…</p>
      ) : (
        <div className={styles.splitLayout}>
          {/* Left: trade list */}
          <div className={styles.tradeList}>
            {filtered.length === 0 ? (
              <div className={styles.emptyState}>
                {search ? "Aucun résultat pour cette recherche." : "Aucune entrée pour l'instant. Crée ta première !"}
              </div>
            ) : (
              filtered.map((e) => (
                <div
                  key={e.id}
                  className={styles.tradeCard}
                  data-side={e.side}
                  data-active={selected?.id === e.id}
                  onClick={() => setSelected(e)}
                >
                  <div className={styles.tradeCardTop}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className={styles.tradePair}>{e.symbol}</span>
                      <span className={styles.sideTag} data-side={e.side}>{e.side}</span>
                    </div>
                    <span
                      className={styles.tradePnl}
                      data-sign={e.profit >= 0 ? "pos" : "neg"}
                    >
                      {fmtPnl(e.profit)}
                    </span>
                  </div>
                  <div className={styles.tradeMeta}>
                    📅 {fmtDate(e.opened_at)} · ⏱ {e.timeframe}
                  </div>
                  {e.setup && <div className={styles.tradeSetup}>{e.setup}</div>}
                  {e.emotions.length > 0 && (
                    <div className={styles.emotionTags}>
                      {e.emotions.map((em) => (
                        <span key={em} className={styles.emotionTag}>{em}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Right: detail */}
          {selected ? (
            <TradeDetail
              key={selected.id}
              entry={selected}
              onDelete={handleDelete}
            />
          ) : (
            <div className={styles.detailPanel}>
              <div className={styles.emptyDetail}>
                <span className={styles.emptyDetailIcon}>📖</span>
                <span>Sélectionne une entrée pour voir les détails</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <NewEntryModal
          onClose={() => setShowModal(false)}
          onCreated={(entry) => void handleCreated(entry)}
        />
      )}
    </div>
  );
}
