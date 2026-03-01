"use client";

import { useEffect, useMemo, useState } from "react";
import { useTrades } from "@/features/trades/hooks";
import { ApiError } from "@/shared/ui/ApiError";
import { JsonBlock } from "@/shared/ui/JsonBlock";
import type { TradeCreateInput, TradeModel } from "@/features/trades/model";

const initialForm: TradeCreateInput = {
  instrument_id: "",
  side: "BUY",
  qty: 1,
  entry_price: 1,
  fees: 0,
  notes: ""
};
const PAGE_SIZE = 20;
const TRADES_UI_PREFS_KEY = "trades_ui_prefs_v1";
type TradesSort = "opened_at_desc" | "opened_at_asc" | "qty_desc" | "entry_desc";
type TradesUIPrefs = {
  instrumentFilter: string;
  sideFilter: string;
  sortBy: TradesSort;
  currentPage: number;
};

export function TradesCard() {
  const { items, loading, error, refresh, submit } = useTrades();
  const persistedPrefs = getPersistedPrefs();
  const [result, setResult] = useState<unknown>(null);
  const [form, setForm] = useState<TradeCreateInput>(initialForm);
  const [instrumentFilter, setInstrumentFilter] = useState(persistedPrefs.instrumentFilter);
  const [sideFilter, setSideFilter] = useState(persistedPrefs.sideFilter);
  const [sortBy, setSortBy] = useState<TradesSort>(persistedPrefs.sortBy);
  const [currentPage, setCurrentPage] = useState(persistedPrefs.currentPage);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onCreate = async () => {
    const payload: TradeCreateInput = {
      ...form,
      notes: form.notes?.trim() ? form.notes : undefined
    };
    const output = await submit(payload);
    setResult(output);
  };

  const visibleTrades = useMemo(() => {
    const normalizedFilter = instrumentFilter.trim().toLowerCase();
    const filtered = items.filter((trade) => {
      const instrument = (trade.instrument_id ?? "").toLowerCase();
      const side = (trade.side ?? "").toUpperCase();
      const matchesInstrument = normalizedFilter ? instrument.includes(normalizedFilter) : true;
      const matchesSide = sideFilter === "ALL" ? true : side === sideFilter;
      return matchesInstrument && matchesSide;
    });

    const sorted = [...filtered].sort((a, b) => compareTrades(a, b, sortBy));
    return sorted;
  }, [items, instrumentFilter, sideFilter, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [instrumentFilter, sideFilter, sortBy, items]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const payload: TradesUIPrefs = {
      instrumentFilter,
      sideFilter,
      sortBy,
      currentPage
    };
    window.localStorage.setItem(TRADES_UI_PREFS_KEY, JSON.stringify(payload));
  }, [instrumentFilter, sideFilter, sortBy, currentPage]);

  const totalPages = Math.max(1, Math.ceil(visibleTrades.length / PAGE_SIZE));
  const pagedTrades = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return visibleTrades.slice(start, start + PAGE_SIZE);
  }, [currentPage, totalPages, visibleTrades]);

  return (
    <section className="card">
      <h2>Trades</h2>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="primary" onClick={() => void refresh()} disabled={loading}>
          {loading ? "Loading..." : "Refresh trades"}
        </button>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <input
          placeholder="Filter instrument (e.g. EURUSD)"
          value={instrumentFilter}
          onChange={(event) => setInstrumentFilter(event.target.value)}
        />
        <select value={sideFilter} onChange={(event) => setSideFilter(event.target.value)} aria-label="Filter side">
          <option value="ALL">ALL sides</option>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
          <option value="LONG">LONG</option>
          <option value="SHORT">SHORT</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} aria-label="Sort trades">
          <option value="opened_at_desc">Newest first</option>
          <option value="opened_at_asc">Oldest first</option>
          <option value="qty_desc">Qty desc</option>
          <option value="entry_desc">Entry price desc</option>
        </select>
      </div>

      <div className="grid">
        <input
          placeholder="instrument_id"
          value={form.instrument_id}
          onChange={(event) => setForm((prev) => ({ ...prev, instrument_id: event.target.value }))}
        />
        <select
          value={form.side}
          onChange={(event) => setForm((prev) => ({ ...prev, side: event.target.value }))}
          aria-label="Trade side"
        >
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
          <option value="LONG">LONG</option>
          <option value="SHORT">SHORT</option>
        </select>
        <input
          type="number"
          step="0.0001"
          placeholder="qty"
          value={form.qty}
          onChange={(event) => setForm((prev) => ({ ...prev, qty: Number(event.target.value) }))}
        />
        <input
          type="number"
          step="0.0001"
          placeholder="entry_price"
          value={form.entry_price}
          onChange={(event) => setForm((prev) => ({ ...prev, entry_price: Number(event.target.value) }))}
        />
        <input
          type="number"
          step="0.0001"
          placeholder="fees"
          value={form.fees}
          onChange={(event) => setForm((prev) => ({ ...prev, fees: Number(event.target.value) }))}
        />
        <input
          placeholder="notes"
          value={form.notes ?? ""}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
        />
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <button className="primary" onClick={() => void onCreate()} disabled={loading}>
          Create trade
        </button>
      </div>

      {error ? <ApiError message={error} /> : null}
      {result ? <JsonBlock value={{ created: result }} /> : null}
      {visibleTrades.length === 0 ? (
        <p className="muted">No trades match current filters.</p>
      ) : (
        <div>
          <p className="muted">
            Showing {pagedTrades.length} of {visibleTrades.length} trades (page {currentPage}/{totalPages})
          </p>
          <div className="row" style={{ marginBottom: 8 }}>
            <button type="button" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage <= 1}>
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </div>
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table>
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Side</th>
                  <th>Qty</th>
                  <th>Entry</th>
                  <th>Opened</th>
                </tr>
              </thead>
              <tbody>
                {pagedTrades.map((trade, index) => (
                  <tr key={trade.id ?? `${trade.instrument_id ?? "trade"}-${index}`}>
                    <td>{trade.instrument_id ?? "-"}</td>
                    <td>{trade.side ?? "-"}</td>
                    <td>{formatNumber(trade.qty)}</td>
                    <td>{formatNumber(trade.entry_price)}</td>
                    <td>{formatDateTime(trade.opened_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function compareTrades(
  a: TradeModel,
  b: TradeModel,
  sortBy: TradesSort
): number {
  if (sortBy === "qty_desc") {
    return (b.qty ?? 0) - (a.qty ?? 0);
  }
  if (sortBy === "entry_desc") {
    return (b.entry_price ?? 0) - (a.entry_price ?? 0);
  }
  const dateA = parseDateToMs(a.opened_at);
  const dateB = parseDateToMs(b.opened_at);
  return sortBy === "opened_at_desc" ? dateB - dateA : dateA - dateB;
}

function parseDateToMs(value?: string): number {
  if (!value) {
    return 0;
  }
  const date = Date.parse(value);
  return Number.isNaN(date) ? 0 : date;
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function formatNumber(value?: number): string {
  if (typeof value !== "number") {
    return "-";
  }
  return value.toFixed(4);
}

function getPersistedPrefs(): TradesUIPrefs {
  const defaults: TradesUIPrefs = {
    instrumentFilter: "",
    sideFilter: "ALL",
    sortBy: "opened_at_desc",
    currentPage: 1
  };
  if (typeof window === "undefined") {
    return defaults;
  }
  try {
    const raw = window.localStorage.getItem(TRADES_UI_PREFS_KEY);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw) as Partial<TradesUIPrefs>;
    return {
      instrumentFilter: typeof parsed.instrumentFilter === "string" ? parsed.instrumentFilter : defaults.instrumentFilter,
      sideFilter: typeof parsed.sideFilter === "string" ? parsed.sideFilter : defaults.sideFilter,
      sortBy: isValidSort(parsed.sortBy) ? parsed.sortBy : defaults.sortBy,
      currentPage:
        typeof parsed.currentPage === "number" && Number.isFinite(parsed.currentPage) && parsed.currentPage > 0
          ? Math.floor(parsed.currentPage)
          : defaults.currentPage
    };
  } catch {
    return defaults;
  }
}

function isValidSort(value: unknown): value is TradesSort {
  return value === "opened_at_desc" || value === "opened_at_asc" || value === "qty_desc" || value === "entry_desc";
}

