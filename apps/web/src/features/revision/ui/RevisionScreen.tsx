"use client";

import { useMemo, useState } from "react";
import type { TradeWithReview } from "@/features/revision/model/types";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { ReviewModal } from "@/features/revision/ui/ReviewModal";
import styles from "@/features/revision/ui/revision.module.css";

const MOCK_TRADES: TradeWithReview[] = [
  {
    trade_id: 1,
    symbol: "EUR/USD",
    side: "BUY",
    profit: 85,
    entry_price: 1.085,
    close_price: 1.0935,
    opened_at: "2024-01-15T09:30:00Z",
    closed_at: "2024-01-15T14:30:00Z",
    review: {
      id: "r1",
      trade_id: 1,
      rating: 4,
      setup_tag: "Breakout retest",
      notes: "Belle exécution, bonne gestion du risque.",
      key_learnings: [
        "Patience payante sur le retest",
        "SL bien placé sous le support",
      ],
      reviewed_at: "2024-01-15T18:00:00Z",
    },
  },
  {
    trade_id: 2,
    symbol: "GBP/JPY",
    side: "SELL",
    profit: -42,
    entry_price: 188.45,
    close_price: 188.87,
    opened_at: "2024-01-14T10:00:00Z",
    closed_at: "2024-01-14T16:00:00Z",
    review: {
      id: "r2",
      trade_id: 2,
      rating: 2,
      setup_tag: "Reversal",
      notes: "Entrée précipitée sans attendre la confirmation.",
      key_learnings: [
        "Ne pas anticiper les reversals sans signal clair",
      ],
      reviewed_at: "2024-01-14T20:00:00Z",
    },
  },
  {
    trade_id: 3,
    symbol: "USD/CHF",
    side: "BUY",
    profit: 120,
    entry_price: 0.872,
    close_price: 0.884,
    opened_at: "2024-01-13T08:00:00Z",
    closed_at: "2024-01-13T18:00:00Z",
    review: {
      id: "r3",
      trade_id: 3,
      rating: 5,
      setup_tag: "Trend continuation",
      notes: "Setup parfait avec confluence de facteurs techniques.",
      key_learnings: [
        "La confluence augmente significativement le taux de réussite",
        "Laisser courir les gagnants en tendance",
      ],
      reviewed_at: "2024-01-13T22:00:00Z",
    },
  },
  {
    trade_id: 4,
    symbol: "AUD/USD",
    side: "BUY",
    profit: 35,
    entry_price: 0.6545,
    close_price: 0.658,
    opened_at: "2024-01-12T01:00:00Z",
    closed_at: "2024-01-12T12:00:00Z",
    review: null,
  },
  {
    trade_id: 5,
    symbol: "EUR/GBP",
    side: "SELL",
    profit: -18,
    entry_price: 0.8612,
    close_price: 0.863,
    opened_at: "2024-01-11T07:00:00Z",
    closed_at: "2024-01-11T15:00:00Z",
    review: null,
  },
];

const MOCK_STATS = {
  reviewed: 3,
  pending: 2,
  avg_rating: 3.7,
  total_insights: 5,
};

function fmtPnl(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(0)}€`;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// ─── Trade review card ─────────────────────────────────────────────

function TradeReviewCard({
  trade,
  onReview,
}: {
  trade: TradeWithReview;
  onReview: (t: TradeWithReview) => void;
}) {
  const isReviewed = !!trade.review?.rating;
  const rating = trade.review?.rating ?? 0;
  const sideLabel = trade.side === "BUY" ? "Long" : "Short";
  const pnlSign = trade.profit >= 0 ? "pos" : "neg";

  return (
    <div className={styles.tradeCard} data-side={trade.side}>
      <div className={styles.tradeCardMain}>
        {/* Icon */}
        <div className={styles.tradeIconWrap} data-side={trade.side}>
          <span style={{ fontSize: "1.2rem" }}>
            {trade.side === "BUY" ? "↗" : "↘"}
          </span>
        </div>

        {/* Info */}
        <div className={styles.tradeInfo}>
          <div className={styles.tradeTopRow}>
            <span className={styles.tradePair}>{trade.symbol}</span>
            <span className={styles.sideTag} data-side={trade.side}>
              {sideLabel}
            </span>
            {trade.review?.setup_tag && (
              <span className={styles.setupTag}>{trade.review.setup_tag}</span>
            )}
            {isReviewed ? (
              <span className={styles.reviewedBadge}>✓ Révisé</span>
            ) : (
              <span className={styles.pendingBadge}>⏳ En attente</span>
            )}
          </div>
          <div className={styles.tradeMeta}>
            📅 {fmtDate(trade.closed_at)} · Entry:{" "}
            {trade.entry_price.toFixed(4)} · Exit:{" "}
            {trade.close_price.toFixed(4)}
          </div>
        </div>

        {/* Right: PnL + rating */}
        <div className={styles.tradeRight}>
          <span className={styles.tradePnl} data-sign={pnlSign}>
            {fmtPnl(trade.profit)}
          </span>
          <div className={styles.ratingDots}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={styles.dot}
                data-filled={n <= rating}
                onClick={() => onReview(trade)}
                aria-label={`Rating ${n}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Expanded: notes + key learnings */}
      {(trade.review?.notes ||
        (trade.review?.key_learnings?.length ?? 0) > 0) && (
        <div className={styles.tradeExpanded}>
          {trade.review?.notes && (
            <div className={styles.notesRow}>
              <span className={styles.notesLabel}>Notes:</span>
              {trade.review.notes}
            </div>
          )}

          {(trade.review?.key_learnings?.length ?? 0) > 0 && (
            <div className={styles.keyLearningsSection}>
              <div className={styles.keyLearningsTitle}>
                <span>◎</span> KEY LEARNINGS
              </div>
              {trade.review?.key_learnings.map((l, i) => (
                <div key={i} className={styles.learningItem}>
                  <span className={styles.learningArrow}>→</span>
                  {l}
                </div>
              ))}
            </div>
          )}

          <div className={styles.expandedActions}>
            <button
              className={styles.aperçuBtn}
              onClick={() => onReview(trade)}
            >
              Aperçu
            </button>
          </div>
        </div>
      )}

      {/* If not reviewed yet, show the "Aperçu" button */}
      {!trade.review?.notes && !trade.review?.key_learnings?.length && (
        <div
          className={styles.tradeExpanded}
          style={{ paddingTop: "0.6rem", paddingBottom: "0.8rem" }}
        >
          <div className={styles.expandedActions}>
            <button
              className={styles.aperçuBtn}
              onClick={() => onReview(trade)}
            >
              {trade.review ? "Aperçu" : "+ Réviser"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main screen ───────────────────────────────────────────────────

export default function RevisionScreen() {
  useLanguage();

  const trades = MOCK_TRADES;
  const stats = MOCK_STATS;
  const [modalTrade, setModalTrade] = useState<TradeWithReview | null>(null);

  const handleSaved = () => {
    setModalTrade(null);
  };

  const avgRatingDisplay = `${stats.avg_rating.toFixed(1)}/5`;

  const sorted = useMemo(() => {
    return [...trades].sort((a, b) => {
      const aRev = a.review?.rating ? 1 : 0;
      const bRev = b.review?.rating ? 1 : 0;
      return bRev - aRev;
    });
  }, [trades]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div>
        <h1 className={styles.pageTitle}>Révision des Trades</h1>
        <p className={styles.pageSubtitle}>
          Revoyez et apprenez de chaque trade
        </p>
      </div>

      {/* KPI cards */}
      <div className={styles.statsRow}>
        <div className={styles.statCard} data-color="green">
          <div className={styles.statIcon}>✓</div>
          <div className={styles.statLabel}>Révisés</div>
          <div className={styles.statValue}>{stats.reviewed}</div>
          <div className={styles.statSub}>trades</div>
        </div>
        <div className={styles.statCard} data-color="amber">
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statLabel}>En attente</div>
          <div className={styles.statValue}>{stats.pending}</div>
          <div className={styles.statSub}>trades</div>
        </div>
        <div className={styles.statCard} data-color="cyan">
          <div className={styles.statIcon}>◎</div>
          <div className={styles.statLabel}>Note Moy</div>
          <div className={styles.statValue}>{avgRatingDisplay}</div>
          <div className={styles.statSub}>qualité d&apos;exécution</div>
        </div>
        <div className={styles.statCard} data-color="navy">
          <div className={styles.statIcon}>💡</div>
          <div className={styles.statLabel}>Insights</div>
          <div className={styles.statValue}>{stats.total_insights}</div>
          <div className={styles.statSub}>améliorations notées</div>
        </div>
      </div>

      {/* Trades list */}
      <h2 className={styles.sectionTitle}>Trades Récents</h2>

      {trades.length === 0 ? (
        <p
          style={{
            color: "var(--ui-color-muted)",
            textAlign: "center",
            padding: "3rem",
          }}
        >
          Aucun trade importé. Importe tes trades MT5 pour commencer la
          révision.
        </p>
      ) : (
        <div className={styles.tradeList}>
          {sorted.map((t) => (
            <TradeReviewCard
              key={t.trade_id}
              trade={t}
              onReview={setModalTrade}
            />
          ))}
        </div>
      )}

      {/* Review modal */}
      {modalTrade && (
        <ReviewModal
          trade={modalTrade}
          onClose={() => setModalTrade(null)}
          onSaved={() => void handleSaved()}
        />
      )}
    </div>
  );
}
