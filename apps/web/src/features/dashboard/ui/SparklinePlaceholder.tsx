import styles from "@/features/dashboard/ui/dashboardV1.module.css";

const BAR_HEIGHTS = [28, 18, 24, 16, 32, 20, 36, 26];

export function SparklinePlaceholder() {
  return (
    <div className={styles.sparkline} aria-hidden>
      {BAR_HEIGHTS.map((height, index) => (
        <span key={`${height}-${index}`} className={styles.sparklineBar} style={{ height }} />
      ))}
    </div>
  );
}
