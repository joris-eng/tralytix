import type { DashboardMode, TopLeakModel } from "@/features/dashboard/model";
import { Badge, Button, Heading, Skeleton, Text } from "@/features/ui/primitives";
import styles from "@/features/dashboard/ui/dashboardV1.module.css";

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
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.leak}</td>
              <td>{row.impact}</td>
              <td>{row.frequency}</td>
              <td>{row.owner}</td>
              <td>
                <Badge variant={row.status === "open" ? "warning" : "neutral"}>{row.status.toUpperCase()}</Badge>
              </td>
            </tr>
          ))}
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
        <Button variant="primary">Open Pro Analysis</Button>
      </div>
    </section>
  );
}
