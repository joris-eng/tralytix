import type { DashboardMode } from "@/features/dashboard/model";
import { Badge, Card, Heading, Text, ToggleTabs, Tooltip } from "@/features/ui/primitives";
import styles from "@/features/dashboard/ui/dashboardV1.module.css";

const MODE_OPTIONS: Array<{ value: DashboardMode; label: string }> = [
  { value: "simple", label: "Simple" },
  { value: "pro", label: "Pro" }
];

type DashboardHeaderProps = {
  title: string;
  subtitle: string;
  rangeLabel: string;
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
};

export function DashboardHeader({ title, subtitle, rangeLabel, mode, onModeChange }: DashboardHeaderProps) {
  return (
    <Card elevated>
      <div className={styles.header}>
        <div>
          <Heading level={1}>{title}</Heading>
          <Text tone="muted" style={{ marginTop: 8 }}>
            {subtitle}
          </Text>
          <div className={styles.headerMeta} style={{ marginTop: 12 }}>
            <Badge variant="primary">Dashboard</Badge>
            <Badge variant="neutral">{rangeLabel}</Badge>
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <Tooltip content="Range picker placeholder (mock)">
            <button type="button" className={styles.rangePicker}>
              Range: {rangeLabel}
            </button>
          </Tooltip>
          <ToggleTabs<DashboardMode> value={mode} options={MODE_OPTIONS} onChange={onModeChange} ariaLabel="Dashboard display mode" />
        </div>
      </div>
    </Card>
  );
}
