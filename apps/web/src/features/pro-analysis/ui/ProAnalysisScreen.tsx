"use client";

import { useMemo, useState } from "react";
import { proAnalysisViewModelMock } from "@/features/pro-analysis/mock";
import type { ProAnalysisFilters, ProAnalysisTrade, TradingSession } from "@/features/pro-analysis/model";
import { SegmentSelector } from "@/features/pro-analysis/ui/SegmentSelector";
import { DataTable, type DataTableColumn, FilterBar } from "@/features/ui/components";
import { Badge, Button, Card, Heading, Text } from "@/features/ui/primitives";
import styles from "@/features/pro-analysis/ui/proAnalysis.module.css";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function formatPnl(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
}

function formatPrice(value: number): string {
  if (value >= 1000) return value.toFixed(1);
  if (value >= 100) return value.toFixed(2);
  return value.toFixed(4);
}

function initialFilters(): ProAnalysisFilters {
  return { ...proAnalysisViewModelMock.filters };
}

function filterTrades(rows: ProAnalysisTrade[], filters: ProAnalysisFilters): ProAnalysisTrade[] {
  return rows.filter((row) => {
    const instrumentMatch = filters.instrument === "ALL" || row.instrument === filters.instrument;
    const directionMatch = filters.direction === "ALL" || row.direction === filters.direction;
    const tagMatch = filters.tag === "ALL" || row.tag === filters.tag;
    const sessionMatch = filters.session === "ALL" || row.session === filters.session;
    return instrumentMatch && directionMatch && tagMatch && sessionMatch;
  });
}

function uniqueValues<T>(input: T[]): T[] {
  return [...new Set(input)];
}

export function ProAnalysisScreen() {
  const viewModel = proAnalysisViewModelMock;
  const [filters, setFilters] = useState<ProAnalysisFilters>(initialFilters);
  const [capitalBucket, setCapitalBucket] = useState(viewModel.capitalBucket);
  const [style, setStyle] = useState(viewModel.tradingStyle);
  const [selectedTradeId, setSelectedTradeId] = useState<string>(viewModel.trades[0]?.id ?? "");

  const filteredTrades = useMemo(() => filterTrades(viewModel.trades, filters), [filters, viewModel.trades]);
  const selectedTrade =
    filteredTrades.find((trade) => trade.id === selectedTradeId) ??
    filteredTrades[0] ??
    viewModel.trades.find((trade) => trade.id === selectedTradeId) ??
    null;

  const columns: DataTableColumn<ProAnalysisTrade>[] = [
    {
      id: "instrument",
      header: "Instrument",
      sortable: true,
      sortAccessor: (row) => row.instrument,
      renderCell: (row) => row.instrument
    },
    {
      id: "direction",
      header: "Direction",
      sortable: true,
      sortAccessor: (row) => row.direction,
      renderCell: (row) => <Badge variant={row.direction === "LONG" ? "success" : "warning"}>{row.direction}</Badge>
    },
    {
      id: "tag",
      header: "Tag",
      sortable: true,
      sortAccessor: (row) => row.tag,
      renderCell: (row) => row.tag
    },
    {
      id: "session",
      header: "Session",
      sortable: true,
      sortAccessor: (row) => row.session,
      renderCell: (row) => row.session
    },
    {
      id: "pnl",
      header: "PnL",
      sortable: true,
      sortAccessor: (row) => row.pnl,
      renderCell: (row) => (
        <span style={{ color: row.pnl >= 0 ? "var(--ui-color-success)" : "var(--ui-color-warning)" }}>{formatPnl(row.pnl)}</span>
      )
    },
    {
      id: "rr",
      header: "R:R",
      sortable: true,
      sortAccessor: (row) => row.rr,
      renderCell: (row) => row.rr.toFixed(2)
    },
    {
      id: "openedAt",
      header: "Opened",
      sortable: true,
      sortAccessor: (row) => row.openedAt,
      renderCell: (row) => formatDateTime(row.openedAt)
    },
    {
      id: "action",
      header: "Action",
      renderCell: (row) => (
        <Button variant="neutral" onClick={() => setSelectedTradeId(row.id)}>
          Inspect
        </Button>
      )
    }
  ];

  const instruments = uniqueValues(viewModel.trades.map((trade) => trade.instrument));
  const tags = uniqueValues(viewModel.trades.map((trade) => trade.tag));
  const sessions = uniqueValues(viewModel.trades.map((trade) => trade.session)) as TradingSession[];

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <Heading level={1}>{viewModel.title}</Heading>
        <Text tone="muted">{viewModel.subtitle}</Text>
      </header>

      <FilterBar
        title="FilterBar"
        actions={
          <Button variant="neutral" onClick={() => setFilters(initialFilters())}>
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
          <span className="ui-filter-label">Instrument</span>
          <select
            className="ui-select"
            value={filters.instrument}
            onChange={(event) => setFilters((prev) => ({ ...prev, instrument: event.target.value }))}
          >
            <option value="ALL">ALL</option>
            {instruments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="ui-filter-field">
          <span className="ui-filter-label">Direction</span>
          <select
            className="ui-select"
            value={filters.direction}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, direction: event.target.value as ProAnalysisFilters["direction"] }))
            }
          >
            <option value="ALL">ALL</option>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
        </label>

        <label className="ui-filter-field">
          <span className="ui-filter-label">Tag</span>
          <select
            className="ui-select"
            value={filters.tag}
            onChange={(event) => setFilters((prev) => ({ ...prev, tag: event.target.value }))}
          >
            <option value="ALL">ALL</option>
            {tags.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="ui-filter-field">
          <span className="ui-filter-label">Session</span>
          <select
            className="ui-select"
            value={filters.session}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, session: event.target.value as ProAnalysisFilters["session"] }))
            }
          >
            <option value="ALL">ALL</option>
            {sessions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
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
            Mock table with local sort and pagination. No backend call.
          </Text>
          <div style={{ marginTop: 12 }}>
            <DataTable<ProAnalysisTrade>
              columns={columns}
              rows={filteredTrades}
              rowKey={(row) => row.id}
              initialSort={{ columnId: "openedAt", direction: "desc" }}
              pageSize={5}
              emptyState={
                <div className={styles.emptyHint}>
                  <Text tone="muted">No trade matches current filters.</Text>
                </div>
              }
            />
          </div>
        </Card>

        <div className={styles.panelsColumn}>
          <Card>
            <Heading level={2}>Trade side panel</Heading>
            {selectedTrade ? (
              <div className={styles.tradeMeta} style={{ marginTop: 12 }}>
                <div className={styles.kv}>
                  <Text tone="muted" size="sm">
                    Trade ID
                  </Text>
                  <Text size="sm">{selectedTrade.id}</Text>
                </div>
                <div className={styles.kv}>
                  <Text tone="muted" size="sm">
                    Instrument
                  </Text>
                  <Text size="sm">{selectedTrade.instrument}</Text>
                </div>
                <div className={styles.kv}>
                  <Text tone="muted" size="sm">
                    Open
                  </Text>
                  <Text size="sm">
                    {formatDateTime(selectedTrade.openedAt)} @ {formatPrice(selectedTrade.entry)}
                  </Text>
                </div>
                <div className={styles.kv}>
                  <Text tone="muted" size="sm">
                    Close
                  </Text>
                  <Text size="sm">
                    {formatDateTime(selectedTrade.closedAt)} @ {formatPrice(selectedTrade.close)}
                  </Text>
                </div>
                <div className={styles.kv}>
                  <Text tone="muted" size="sm">
                    Risk plan
                  </Text>
                  <Text size="sm">
                    SL {formatPrice(selectedTrade.stop)} / TP {formatPrice(selectedTrade.target)}
                  </Text>
                </div>
                <div className={styles.kv}>
                  <Text tone="muted" size="sm">
                    Duration
                  </Text>
                  <Text size="sm">{selectedTrade.durationMin} min</Text>
                </div>
                <div className={styles.kv}>
                  <Text tone="muted" size="sm">
                    Notes
                  </Text>
                  <Text size="sm">{selectedTrade.notes}</Text>
                </div>
                <div className={styles.sidePanelActions}>
                  <Button variant="primary">Pin trade</Button>
                  <Button variant="neutral">Add note</Button>
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
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {viewModel.alerts.map((alert) => (
                <Card key={alert.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <Heading level={3}>{alert.title}</Heading>
                    <Badge variant={alert.level}>{alert.level.toUpperCase()}</Badge>
                  </div>
                  <Text tone="muted" size="sm" style={{ marginTop: 8 }}>
                    {alert.detail}
                  </Text>
                  <Text size="sm" style={{ marginTop: 8 }}>
                    {alert.recommendation}
                  </Text>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </section>
  );
}
