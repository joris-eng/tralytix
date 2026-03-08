"use client";

import { useEffect, useMemo, useState } from "react";
import { useProAnalysisTrades } from "@/features/pro-analysis/hooks";
import type { ProAnalysisFilters, ProAnalysisTrade } from "@/features/pro-analysis/model";
import { SegmentSelector } from "@/features/pro-analysis/ui/SegmentSelector";
import { DataTable, type DataTableColumn, FilterBar } from "@/features/ui/components";
import { Badge, Button, Card, Heading, Skeleton, Text } from "@/features/ui/primitives";
import styles from "@/features/pro-analysis/ui/proAnalysis.module.css";

const DEFAULT_FILTERS: ProAnalysisFilters = {
  dateRange: "Last 30 days",
  symbol: "ALL",
  side: "ALL"
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function formatProfit(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
}

function formatPrice(value: number): string {
  if (value >= 1000) return value.toFixed(1);
  if (value >= 100) return value.toFixed(2);
  return value.toFixed(4);
}

function rangeToDays(value: string): number | null {
  if (value === "Last 7 days") return 7;
  if (value === "Last 30 days") return 30;
  if (value === "Last 90 days") return 90;
  return null;
}

function filterTrades(rows: ProAnalysisTrade[], filters: ProAnalysisFilters): ProAnalysisTrade[] {
  const daysRange = rangeToDays(filters.dateRange);
  const now = new Date();

  return rows.filter((row) => {
    const openedAt = new Date(row.opened_at);
    const dateMatch =
      daysRange === null ||
      Number.isNaN(openedAt.getTime()) ||
      now.getTime() - openedAt.getTime() <= daysRange * 24 * 60 * 60 * 1000;
    const symbolMatch = filters.symbol === "ALL" || row.symbol === filters.symbol;
    const sideMatch = filters.side === "ALL" || row.side === filters.side;
    return dateMatch && symbolMatch && sideMatch;
  });
}

function uniqueValues<T>(input: T[]): T[] {
  return [...new Set(input)];
}

export function ProAnalysisScreen() {
  const [filters, setFilters] = useState<ProAnalysisFilters>(DEFAULT_FILTERS);
  const [capitalBucket, setCapitalBucket] = useState<"small" | "mid" | "large">("mid");
  const [style, setStyle] = useState<"scalping" | "intraday" | "swing">("intraday");
  const [selectedTradeKey, setSelectedTradeKey] = useState<string>("");
  const { data, loading, error, refresh } = useProAnalysisTrades();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const trades = useMemo(() => data?.trades ?? [], [data]);
  const filteredTrades = useMemo(() => filterTrades(trades, filters), [filters, trades]);
  const selectedTrade = useMemo(
    () =>
      filteredTrades.find((trade) => `${trade.ticket}-${trade.opened_at}` === selectedTradeKey) ??
      filteredTrades[0] ??
      trades.find((trade) => `${trade.ticket}-${trade.opened_at}` === selectedTradeKey) ??
      null,
    [filteredTrades, trades, selectedTradeKey]
  );

  useEffect(() => {
    if (selectedTrade) {
      setSelectedTradeKey(`${selectedTrade.ticket}-${selectedTrade.opened_at}`);
    }
  }, [selectedTrade]);

  const columns: DataTableColumn<ProAnalysisTrade>[] = [
    {
      id: "ticket",
      header: "Ticket",
      sortable: true,
      sortAccessor: (row) => row.ticket,
      renderCell: (row) => row.ticket
    },
    {
      id: "symbol",
      header: "Symbol",
      sortable: true,
      sortAccessor: (row) => row.symbol,
      renderCell: (row) => row.symbol
    },
    {
      id: "side",
      header: "Side",
      sortable: true,
      sortAccessor: (row) => row.side,
      renderCell: (row) => <Badge variant={row.side === "LONG" ? "success" : "warning"}>{row.side}</Badge>
    },
    {
      id: "volume",
      header: "Volume",
      sortable: true,
      sortAccessor: (row) => row.volume,
      renderCell: (row) => row.volume.toFixed(2)
    },
    {
      id: "open_price",
      header: "Open price",
      sortable: true,
      sortAccessor: (row) => row.open_price,
      renderCell: (row) => formatPrice(row.open_price)
    },
    {
      id: "close_price",
      header: "Close price",
      sortable: true,
      sortAccessor: (row) => row.close_price ?? Number.NEGATIVE_INFINITY,
      renderCell: (row) => (row.close_price == null ? "—" : formatPrice(row.close_price))
    },
    {
      id: "profit",
      header: "Profit",
      sortable: true,
      sortAccessor: (row) => row.profit,
      renderCell: (row) => (
        <span style={{ color: row.profit >= 0 ? "var(--ui-color-success)" : "var(--ui-color-warning)" }}>
          {formatProfit(row.profit)}
        </span>
      )
    },
    {
      id: "opened_at",
      header: "Opened at",
      sortable: true,
      sortAccessor: (row) => row.opened_at,
      renderCell: (row) => formatDateTime(row.opened_at)
    },
    {
      id: "closed_at",
      header: "Closed at",
      sortable: true,
      sortAccessor: (row) => row.closed_at ?? "",
      renderCell: (row) => formatDateTime(row.closed_at)
    },
    {
      id: "action",
      header: "Action",
      renderCell: (row) => (
        <Button variant="neutral" onClick={() => setSelectedTradeKey(`${row.ticket}-${row.opened_at}`)}>
          Inspect
        </Button>
      )
    }
  ];

  const symbols = uniqueValues(trades.map((trade) => trade.symbol));

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <Heading level={1}>Pro Analysis</Heading>
        <Text tone="muted">Drilldown workspace for trade-level diagnostics and pattern detection.</Text>
      </header>

      <FilterBar
        title="FilterBar"
        actions={
          <Button variant="neutral" onClick={() => setFilters(DEFAULT_FILTERS)}>
            Reset filters
          </Button>
        }
      >
        <label className="ui-filter-field">
          <span className="ui-filter-label">Date range</span>
          <select
            className="ui-select"
            value={filters.dateRange}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateRange: event.target.value }))}
          >
            <option value="Last 7 days">Last 7 days</option>
            <option value="Last 30 days">Last 30 days</option>
            <option value="Last 90 days">Last 90 days</option>
          </select>
        </label>

        <label className="ui-filter-field">
          <span className="ui-filter-label">Symbol</span>
          <select
            className="ui-select"
            value={filters.symbol}
            onChange={(event) => setFilters((prev) => ({ ...prev, symbol: event.target.value }))}
          >
            <option value="ALL">ALL</option>
            {symbols.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="ui-filter-field">
          <span className="ui-filter-label">Side</span>
          <select
            className="ui-select"
            value={filters.side}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, side: event.target.value as ProAnalysisFilters["side"] }))
            }
          >
            <option value="ALL">ALL</option>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
        </label>
      </FilterBar>

      <SegmentSelector
        capitalBucket={capitalBucket}
        style={style}
        onCapitalBucketChange={setCapitalBucket}
        onStyleChange={setStyle}
      />

      <section className={styles.mainGrid}>
        <Card>
          <Heading level={2}>Trades drilldown</Heading>
          <Text tone="muted" size="sm" style={{ marginTop: 8 }}>
            Raw MT5 trades with local filtering, sorting and pagination.
          </Text>
          <div style={{ marginTop: 12 }}>
            {loading ? (
              <div style={{ display: "grid", gap: 8 }}>
                <Skeleton width="100%" height={42} />
                <Skeleton width="100%" height={42} />
                <Skeleton width="100%" height={42} />
              </div>
            ) : error ? (
              <Text className="ui-text-error" size="sm">
                {error}
              </Text>
            ) : (
              <DataTable<ProAnalysisTrade>
                columns={columns}
                rows={filteredTrades}
                rowKey={(row) => `${row.ticket}-${row.opened_at}`}
                initialSort={{ columnId: "opened_at", direction: "desc" }}
                pageSize={5}
                emptyState={
                  <div className={styles.emptyHint}>
                    <Text tone="muted">No trade matches current filters.</Text>
                  </div>
                }
              />
            )}
          </div>
        </Card>

        <div className={styles.panelsColumn}>
          <Card>
            <Heading level={2}>Trade side panel</Heading>
            {loading ? (
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                <Skeleton width="100%" height={18} />
                <Skeleton width="100%" height={18} />
                <Skeleton width="100%" height={18} />
              </div>
            ) : error ? (
              <Text className="ui-text-error" size="sm" style={{ marginTop: 12 }}>
                {error}
              </Text>
            ) : selectedTrade ? (
              <div className={styles.tradeMeta} style={{ marginTop: 12 }}>
                <div className={styles.kv}>
                  <Text tone="muted" size="sm">
                    Ticket
                  </Text>
                  <Text size="sm">{selectedTrade.ticket}</Text>
                </div>
                <div className={styles.kv}>
                  <Text tone="muted" size="sm">
                    Symbol
                  </Text>
                  <Text size="sm">{selectedTrade.symbol}</Text>
                </div>
                <div className={styles.kv}>
                  <Text tone="muted" size="sm">
                    Side
                  </Text>
                  <Text size="sm">{selectedTrade.side}</Text>
                </div>
                <div className={styles.kv}>
                  <Text tone="muted" size="sm">
                    Open
                  </Text>
                  <Text size="sm">
                    {formatDateTime(selectedTrade.opened_at)} @ {formatPrice(selectedTrade.open_price)}
                  </Text>
                </div>
                <div className={styles.kv}>
                  <Text tone="muted" size="sm">
                    Close
                  </Text>
                  <Text size="sm">
                    {formatDateTime(selectedTrade.closed_at)} @{" "}
                    {selectedTrade.close_price == null ? "—" : formatPrice(selectedTrade.close_price)}
                  </Text>
                </div>
                <div className={styles.kv}>
                  <Text tone="muted" size="sm">
                    Profit
                  </Text>
                  <Text size="sm">{formatProfit(selectedTrade.profit)}</Text>
                </div>
                <div className={styles.kv}>
                  <Text tone="muted" size="sm">
                    Commission / Swap
                  </Text>
                  <Text size="sm">
                    {selectedTrade.commission.toFixed(2)} / {selectedTrade.swap.toFixed(2)}
                  </Text>
                </div>
              </div>
            ) : (
              <Text tone="muted" style={{ marginTop: 12 }}>
                Select a trade from the table to inspect details.
              </Text>
            )}
          </Card>

          <Card>
            <Heading level={2}>Insights panel</Heading>
            <Text tone="muted" size="sm" style={{ marginTop: 12 }}>
              Insights are available in the dashboard analytics modules.
            </Text>
          </Card>
        </div>
      </section>
    </section>
  );
}
