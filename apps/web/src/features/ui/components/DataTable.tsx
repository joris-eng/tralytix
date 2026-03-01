"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button, Text } from "@/features/ui/primitives";

type SortDirection = "asc" | "desc";

type DataTableColumn<T> = {
  id: string;
  header: string;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number;
  renderCell: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  pageSize?: number;
  initialSort?: {
    columnId: string;
    direction: SortDirection;
  };
  emptyState?: ReactNode;
};

function compareSortValues(a: string | number, b: string | number, direction: SortDirection): number {
  if (typeof a === "number" && typeof b === "number") {
    return direction === "asc" ? a - b : b - a;
  }
  const result = String(a).localeCompare(String(b), undefined, { sensitivity: "base", numeric: true });
  return direction === "asc" ? result : -result;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  pageSize = 8,
  initialSort,
  emptyState
}: DataTableProps<T>) {
  const [sortState, setSortState] = useState<{
    columnId: string;
    direction: SortDirection;
  } | null>(initialSort ?? null);
  const [page, setPage] = useState(1);

  const sortedRows = useMemo(() => {
    if (!sortState) {
      return rows;
    }
    const column = columns.find((entry) => entry.id === sortState.columnId);
    if (!column || !column.sortable || !column.sortAccessor) {
      return rows;
    }
    const output = [...rows];
    output.sort((a, b) => compareSortValues(column.sortAccessor!(a), column.sortAccessor!(b), sortState.direction));
    return output;
  }, [columns, rows, sortState]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedRows = sortedRows.slice(start, start + pageSize);

  const setSorting = (column: DataTableColumn<T>) => {
    if (!column.sortable) return;
    setPage(1);
    setSortState((prev) => {
      if (!prev || prev.columnId !== column.id) {
        return { columnId: column.id, direction: "asc" };
      }
      return { columnId: column.id, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  };

  if (rows.length === 0) {
    return emptyState ?? (
      <Text size="sm" tone="muted">
        No rows to display.
      </Text>
    );
  }

  return (
    <section>
      <div className="ui-data-table-wrap">
        <table className="ui-data-table">
          <thead>
            <tr>
              {columns.map((column) => {
                const active = sortState?.columnId === column.id;
                const direction = active ? (sortState?.direction === "asc" ? " ↑" : " ↓") : "";
                return (
                  <th key={column.id}>
                    {column.sortable ? (
                      <button type="button" data-sortable="true" onClick={() => setSorting(column)}>
                        {column.header}
                        {direction}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row, index) => (
              <tr key={rowKey(row, index)}>
                {columns.map((column) => (
                  <td key={column.id}>{column.renderCell(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ui-data-table-pagination">
        <Text size="sm" tone="muted">
          Showing {pagedRows.length} of {sortedRows.length} rows (page {safePage}/{totalPages})
        </Text>
        <div style={{ display: "inline-flex", gap: 8 }}>
          <Button variant="neutral" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={safePage <= 1}>
            Previous
          </Button>
          <Button
            variant="neutral"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}

export type { DataTableColumn };
