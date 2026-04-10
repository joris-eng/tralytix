"use client";

import { useMemo, useState } from "react";
import type { JournalEntry } from "@/features/journal/model/types";
import { NewEntryModal } from "@/features/journal/ui/NewEntryModal";
import styles from "@/features/journal/ui/journal.module.css";

const MOCK_ENTRIES: JournalEntry[] = [
  {
    id: "1",
    symbol: "EUR/USD",
    side: "LONG",
    timeframe: "H4",
    entry_price: 1.085,
    close_price: 1.092,
    profit: 70.0,
    opened_at: "2024-01-15T09:30:00Z",
    setup: "Breakout haussier",
    emotions: ["Confiant", "Discipliné"],
    notes:
      "Bonne lecture du marché, entrée sur pullback après cassure de résistance.",
    lessons: "Toujours attendre la confirmation avant d'entrer.",
    created_at: "2024-01-15T09:30:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    symbol: "GBP/JPY",
    side: "SHORT",
    timeframe: "H1",
    entry_price: 188.45,
    close_price: 187.92,
    profit: 53.0,
    opened_at: "2024-01-14T14:00:00Z",
    setup: "Rejet de résistance",
    emotions: ["Patient"],
    notes: "Entrée après double top confirmé.",
    lessons: "Les doubles tops sur GBP/JPY sont fiables en H1.",
    created_at: "2024-01-14T14:00:00Z",
    updated_at: "2024-01-14T15:00:00Z",
  },
  {
    id: "3",
    symbol: "USD/CHF",
    side: "LONG",
    timeframe: "M30",
    entry_price: 0.872,
    close_price: 0.868,
    profit: -40.0,
    opened_at: "2024-01-13T11:15:00Z",
    setup: "Support bounce",
    emotions: ["Impatient", "Frustré"],
    notes: "Entré trop tôt, pas attendu la confirmation.",
    lessons:
      "Ne pas entrer sur simple touche de support, attendre un pattern de retournement.",
    created_at: "2024-01-13T11:15:00Z",
    updated_at: "2024-01-13T12:00:00Z",
  },
  {
    id: "4",
    symbol: "AUD/USD",
    side: "LONG",
    timeframe: "D1",
    entry_price: 0.6545,
    close_price: 0.662,
    profit: 75.0,
    opened_at: "2024-01-12T00:00:00Z",
    setup: "Trend continuation",
    emotions: ["Confiant", "Patient"],
    notes: "Suivi de tendance classique avec pullback sur EMA 20.",
    lessons: "Les setups de continuation en D1 ont un excellent ratio R/R.",
    created_at: "2024-01-12T00:00:00Z",
    updated_at: "2024-01-12T08:00:00Z",
  },
  {
    id: "5",
    symbol: "EUR/GBP",
    side: "SHORT",
    timeframe: "H4",
    entry_price: 0.8612,
    close_price: 0.8635,
    profit: -23.0,
    opened_at: "2024-01-11T08:00:00Z",
    setup: "Breakout baissier",
    emotions: ["Stressé"],
    notes: "Faux breakout, le prix a rapidement repris au-dessus du support.",
    lessons: "Attendre la clôture de la bougie avant d'entrer sur breakout.",
    created_at: "2024-01-11T08:00:00Z",
    updated_at: "2024-01-11T12:00:00Z",
  },
];

const MOCK_STATS = {
  total_entries: 5,
  documented_setups: 5,
  lessons_learned: 5,
  documentation_rate: 100,
};

function fmtPnl(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}`;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Trade detail panel ────────────────────────────────────────────

function TradeDetail({
  entry,
  onDelete,
}: {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    if (!confirm("Supprimer cette entrée ?")) return;
    setDeleting(true);
    onDelete(entry.id);
    setDeleting(false);
  };

  return (
    <div className={styles.detailPanel}>
      {/* Header */}
      <div className={styles.detailHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <span className={styles.detailPair}>{entry.symbol}</span>
          <span className={styles.detailSideTag} data-side={entry.side}>
            {entry.side}
          </span>
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
          <div className={styles.priceBoxValue}>
            {entry.entry_price.toFixed(4)}
          </div>
        </div>
        <div className={styles.priceBox}>
          <div className={styles.priceBoxLabel}>
            <span>↘</span> Exit
          </div>
          <div className={styles.priceBoxValue}>
            {entry.close_price.toFixed(4)}
          </div>
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
              <span key={e} className={styles.emotionTag}>
                {e}
              </span>
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

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>(MOCK_ENTRIES);
  const stats = MOCK_STATS;
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

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setSelected(null);
  };

  const handleCreated = (entry: JournalEntry) => {
    setEntries((prev) => [entry, ...prev]);
    setSelected(entry);
  };

  const docRate = Math.round(stats.documentation_rate);

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
          <div className={styles.statValue}>{stats.total_entries}</div>
        </div>
        <div className={styles.statCard} data-color="blue">
          <div className={styles.statLabel}>Setups documentés</div>
          <div className={styles.statValue}>{stats.documented_setups}</div>
        </div>
        <div className={styles.statCard} data-color="purple">
          <div className={styles.statLabel}>Leçons apprises</div>
          <div className={styles.statValue}>{stats.lessons_learned}</div>
        </div>
        <div className={styles.statCard} data-color="amber">
          <div className={styles.statLabel}>Taux de documentation</div>
          <div className={styles.statValue}>{docRate}%</div>
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
      <div className={styles.splitLayout}>
        {/* Left: trade list */}
        <div className={styles.tradeList}>
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              {search
                ? "Aucun résultat pour cette recherche."
                : "Aucune entrée pour l'instant. Crée ta première !"}
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span className={styles.tradePair}>{e.symbol}</span>
                    <span className={styles.sideTag} data-side={e.side}>
                      {e.side}
                    </span>
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
                {e.setup && (
                  <div className={styles.tradeSetup}>{e.setup}</div>
                )}
                {e.emotions.length > 0 && (
                  <div className={styles.emotionTags}>
                    {e.emotions.map((em) => (
                      <span key={em} className={styles.emotionTag}>
                        {em}
                      </span>
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
