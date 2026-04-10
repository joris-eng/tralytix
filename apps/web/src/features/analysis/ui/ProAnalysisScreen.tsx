"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "@/features/pro-analysis/ui/proAnalysis.module.css";

interface Trade {
  ticket: string;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  closePrice: number;
  profit: number;
  openTime: string;
  closeTime: string;
  commission?: number;
  swap?: number;
  duration?: number;
}

const mockTrades: Trade[] = [
  { ticket: "MOCK-100098", symbol: "XAU/USD", type: "sell", volume: 1.39, openPrice: 1997.8, closePrice: 2035.9, profit: -529.4, openTime: "2026-03-05T21:32:47Z", closeTime: "2026-03-07T00:48:47Z", commission: -1.64, swap: -0.63, duration: 97800 },
  { ticket: "MOCK-100076", symbol: "GBP/USD", type: "sell", volume: 1.77, openPrice: 1.2625, closePrice: 1.2721, profit: -1358.0, openTime: "2026-03-05T13:07:47Z", closeTime: "2026-03-06T01:24:47Z", commission: -2.12, swap: -0.89, duration: 44220 },
  { ticket: "MOCK-100071", symbol: "GBP/USD", type: "buy", volume: 0.26, openPrice: 1.2932, closePrice: 1.2692, profit: -484.7, openTime: "2026-03-04T10:51:47Z", closeTime: "2026-03-05T10:05:47Z", commission: -0.78, swap: -0.32, duration: 84240 },
];

interface Filters {
  dateRange: string;
  symbol: string;
  side: string;
}

const DEFAULT_FILTERS: Filters = {
  dateRange: "Last 30 days",
  symbol: "ALL",
  side: "ALL",
};

const PAGE_SIZE = 5;

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const date = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return `${date} ${time}`;
}

function formatPrice(v: number): string {
  if (v >= 1000) return v.toFixed(1);
  if (v >= 100) return v.toFixed(2);
  return v.toFixed(4);
}

function formatProfit(v: number): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;
}

function rangeToDays(value: string): number | null {
  if (value === "Last 7 days") return 7;
  if (value === "Last 30 days") return 30;
  if (value === "Last 90 days") return 90;
  return null;
}

function filterTrades(rows: Trade[], filters: Filters): Trade[] {
  const days = rangeToDays(filters.dateRange);
  const now = new Date();
  return rows.filter((row) => {
    const openedAt = new Date(row.openTime);
    const dateMatch =
      days === null ||
      Number.isNaN(openedAt.getTime()) ||
      now.getTime() - openedAt.getTime() <= days * 86400_000;
    const symbolMatch = filters.symbol === "ALL" || row.symbol === filters.symbol;
    const sideMatch = filters.side === "ALL" || row.type === filters.side;
    return dateMatch && symbolMatch && sideMatch;
  });
}

function uniqueValues<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function tradeKey(t: Trade) {
  return `${t.ticket}-${t.openTime}`;
}

type Segment = "small" | "mid" | "large" | "scalping" | "intraday" | "swing";

const SEGMENTS: { value: Segment; label: string }[] = [
  { value: "small", label: "Small capital" },
  { value: "mid", label: "Mid capital" },
  { value: "large", label: "Large capital" },
  { value: "scalping", label: "Scalping" },
  { value: "intraday", label: "Intraday" },
  { value: "swing", label: "Swing" },
];

export default function ProAnalysisScreen() {
  const [trades] = useState(mockTrades);
  const loading = false;
  const error = null;

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [activeSegments, setActiveSegments] = useState<Set<Segment>>(new Set(["intraday"]));
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [page, setPage] = useState(1);

  const filteredTrades = useMemo(() => filterTrades(trades, filters), [filters, trades]);
  const symbols = useMemo(() => uniqueValues(trades.map((t) => t.symbol)), [trades]);

  const totalRows = filteredTrades.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filteredTrades.slice(pageStart, pageStart + PAGE_SIZE);

  const selectedTrade = useMemo(
    () =>
      filteredTrades.find((t) => tradeKey(t) === selectedKey) ??
      trades.find((t) => tradeKey(t) === selectedKey) ??
      null,
    [filteredTrades, trades, selectedKey]
  );

  useEffect(() => {
    if (!selectedKey && filteredTrades.length > 0) {
      setSelectedKey(tradeKey(filteredTrades[0]));
    }
  }, [filteredTrades, selectedKey]);

  const toggleSegment = (seg: Segment) => {
    setActiveSegments((prev) => {
      const next = new Set(prev);
      if (next.has(seg)) { next.delete(seg); } else { next.add(seg); }
      return next;
    });
  };

  const handleFilterChange = <K extends keyof Filters>(key: K, val: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const sideDisplay = selectedTrade?.type?.toUpperCase() ?? "—";
  const sideBadgeKey = selectedTrade?.type?.toUpperCase() ?? "SELL";

  void loading;
  void error;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div>
        <h1 className={styles.pageTitle}>Pro Analysis</h1>
        <p className={styles.pageSubtitle}>Drilldown avancé de vos trades avec filtres multi-segments.</p>
      </div>

      {/* FilterBar */}
      <div className={styles.filterBar}>
        <div className={styles.filterBarLabel}>Filterbar</div>
        <div className={styles.filterRow}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Date range</label>
            <select
              className={styles.filterSelect}
              value={filters.dateRange}
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
            >
              <option value="Last 7 days">Last 7 days</option>
              <option value="Last 30 days">Last 30 days</option>
              <option value="Last 90 days">Last 90 days</option>
              <option value="All time">All time</option>
            </select>
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Symbol</label>
            <select
              className={styles.filterSelect}
              value={filters.symbol}
              onChange={(e) => handleFilterChange("symbol", e.target.value)}
            >
              <option value="ALL">ALL</option>
              {symbols.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Side</label>
            <select
              className={styles.filterSelect}
              value={filters.side}
              onChange={(e) => handleFilterChange("side", e.target.value)}
            >
              <option value="ALL">ALL</option>
              <option value="buy">BUY</option>
              <option value="sell">SELL</option>
            </select>
          </div>

          <button className={styles.resetBtn} onClick={() => { setFilters(DEFAULT_FILTERS); setPage(1); }}>
            ⟳ Réinitialiser
          </button>
        </div>
      </div>

      {/* Segment selector */}
      <div className={styles.segments}>
        {SEGMENTS.map((seg) => (
          <button
            key={seg.value}
            type="button"
            className={styles.segPill}
            data-active={activeSegments.has(seg.value)}
            onClick={() => toggleSegment(seg.value)}
          >
            {seg.label}
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className={styles.mainGrid}>
        {/* Trades drilldown */}
        <div className={styles.drillCard}>
          <div className={styles.drillHeader}>
            <p className={styles.drillTitle}>Trades drilldown</p>
            <p className={styles.drillSubtitle}>Raw MT5 trades with local filtering, sorting and pagination.</p>
          </div>

          {filteredTrades.length === 0 ? (
            <div className={styles.emptyHint}>Aucun trade ne correspond aux filtres actuels.</div>
          ) : (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th className={styles.right}>Volume</th>
                    <th className={styles.right}>Open price</th>
                    <th className={styles.right}>Close price</th>
                    <th className={styles.right}>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => {
                    const key = tradeKey(row);
                    const normSide = row.type.toUpperCase();
                    return (
                      <tr
                        key={key}
                        data-active={selectedKey === key}
                        onClick={() => setSelectedKey(key)}
                      >
                        <td>{row.ticket}</td>
                        <td>{row.symbol}</td>
                        <td>
                          <span className={styles.sideBadge} data-side={normSide}>{normSide}</span>
                        </td>
                        <td className={styles.right}>{row.volume.toFixed(2)}</td>
                        <td className={styles.right}>{formatPrice(row.openPrice)}</td>
                        <td className={styles.right}>{formatPrice(row.closePrice)}</td>
                        <td className={`${styles.right} ${row.profit >= 0 ? styles.profitPos : styles.profitNeg}`}>
                          {formatProfit(row.profit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className={styles.pagination}>
                <span className={styles.paginationInfo}>
                  Showing {PAGE_SIZE} of {totalRows} rows (page {safePage}/{totalPages})
                </span>
                <div className={styles.paginationBtns}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                  >
                    Previous
                  </button>
                  <button
                    className={`${styles.pageBtn} ${styles.pageBtnActive}`}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right panels */}
        <div className={styles.panelsColumn}>
          {/* Trade side panel */}
          <div className={styles.sidePanel}>
            <p className={styles.sidePanelTitle}>Trade side panel</p>

            {!selectedTrade ? (
              <div className={styles.emptyPanel}>Sélectionne un trade dans le tableau.</div>
            ) : (
              <>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Ticket</span>
                  <span className={styles.kvValue} style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                    {selectedTrade.ticket}
                  </span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Symbol</span>
                  <span className={styles.kvValue} style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                    {selectedTrade.symbol}
                  </span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Side</span>
                  <span className={styles.kvValue}>{sideDisplay}</span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Open</span>
                  <span className={styles.kvValue}>
                    {formatDateTime(selectedTrade.openTime)} @ {formatPrice(selectedTrade.openPrice)}
                  </span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Close</span>
                  <span className={styles.kvValue}>
                    {formatDateTime(selectedTrade.closeTime)} @ {formatPrice(selectedTrade.closePrice)}
                  </span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Profit</span>
                  <span
                    className={`${styles.kvValueLarge} ${selectedTrade.profit >= 0 ? styles.profitPos : styles.profitNeg}`}
                  >
                    {formatProfit(selectedTrade.profit)}
                  </span>
                </div>
                <div className={styles.kv}>
                  <span className={styles.kvLabel}>Commission / Swap</span>
                  <span className={styles.kvValue}>
                    {(selectedTrade.commission ?? 0).toFixed(2)} / {(selectedTrade.swap ?? 0).toFixed(2)}
                  </span>
                </div>

                <div className={styles.sidePanelActions}>
                  <span className={styles.sideBadge} data-side={sideBadgeKey} style={{ marginRight: "0.5rem" }}>
                    {sideDisplay}
                  </span>
                  <button className={styles.aperçuBtn}>Aperçu</button>
                </div>
              </>
            )}
          </div>

          {/* Insights panel */}
          <div className={styles.insightsPanel}>
            <p className={styles.insightsPanelTitle}>Insights panel</p>
            <p className={styles.insightsPanelText}>
              Insights are available in the dashboard analytics modules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
