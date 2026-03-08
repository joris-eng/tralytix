import type { DashboardMode, TopLeakModel } from "@/features/dashboard/model";
import Link from "next/link";
import { Heading, Skeleton, Text } from "@/features/ui/primitives";
import styles from "@/features/dashboard/ui/dashboardV1.module.css";

function impactBorderColor(impact: string): string {
  const lower = impact.toLowerCase();
  if (lower.includes("high")) return "#ff4d6d";
  if (lower.includes("med")) return "#ffb547";
  return "#00e5a0";
}

type TopLeaksSectionProps = {
  mode: DashboardMode;
  rows: TopLeakModel[];
};

function TablePlaceholder({ rows }: { rows: TopLeakModel[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Leak</th>
            <th>Impact</th>
            <th>Frequency</th>
            <th>Owner</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const borderColor = impactBorderColor(row.impact);
            return (
              <tr key={row.id} className={i % 2 === 0 ? styles.tableRowOdd : undefined}>
                <td style={{ borderLeft: `3px solid ${borderColor}`, paddingLeft: 10 }}>
                  {row.leak}
                </td>
                <td>{row.impact}</td>
                <td>{row.frequency}</td>
                <td>{row.owner}</td>
                <td>
                  <span
                    className={styles.statusPill}
                    data-status={row.status}
                  >
                    {row.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProHiddenPlaceholder() {
  return (
    <div className={styles.proHiddenNotice}>
      <Text tone="muted">
        Detailed leak table is available in Pro mode. Switch to Pro to unlock full diagnostics and drill-down controls.
      </Text>
      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        <Skeleton height={12} />
        <Skeleton height={12} width="85%" />
        <Skeleton height={12} width="72%" />
      </div>
    </div>
  );
}

export function TopLeaksSection({ mode, rows }: TopLeaksSectionProps) {
  return (
    <section>
      <Heading level={2}>Top leaks</Heading>
      {mode === "pro" ? <TablePlaceholder rows={rows} /> : <ProHiddenPlaceholder />}
      <div className={styles.topLeaksFooter}>
        <Text size="sm" tone="subtle">
          Open the advanced workspace for deeper analysis and remediation workflows.
        </Text>
        <Link href="/pro-analysis" className="ui-button" data-variant="primary">
          Open Pro Analysis
        </Link>
      </div>
    </section>
  );
}
