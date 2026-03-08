import styles from "@/features/dashboard/ui/dashboardV1.module.css";

// Heights scaled so minimum is ~40px; last bar is the tallest (accent-primary)
const BAR_HEIGHTS = [42, 32, 46, 28, 52, 38, 48, 62];

export function SparklinePlaceholder() {
  const last = BAR_HEIGHTS.length - 1;
  return (
    <div className={styles.sparkline} aria-hidden>
      {BAR_HEIGHTS.map((height, index) => (
        <span
          key={`${height}-${index}`}
          className={styles.sparklineBar}
          style={{
            height,
            background: index === last ? "var(--ui-color-primary)" : "rgba(255, 255, 255, 0.15)",
            opacity: index === last ? 1 : 0.4
          }}
        />
      ))}
    </div>
  );
}
