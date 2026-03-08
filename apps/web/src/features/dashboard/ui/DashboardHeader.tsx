import type { DashboardMode } from "@/features/dashboard/model";
import { ToggleTabs } from "@/features/ui/primitives";
import styles from "@/features/dashboard/ui/dashboardHeader.module.css";

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
    <div className={styles.root}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      <div className={styles.right}>
        <span className={styles.rangeLabel}>{rangeLabel}</span>
        <ToggleTabs<DashboardMode>
          value={mode}
          options={MODE_OPTIONS}
          onChange={onModeChange}
          ariaLabel="Dashboard display mode"
        />
      </div>
    </div>
  );
}
