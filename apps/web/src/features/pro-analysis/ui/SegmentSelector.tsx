"use client";

import type { CapitalBucket, TradingStyle } from "@/features/pro-analysis/model";
import { ToggleTabs } from "@/features/ui/primitives";
import styles from "@/features/pro-analysis/ui/proAnalysis.module.css";

const CAPITAL_OPTIONS: Array<{ value: CapitalBucket; label: string }> = [
  { value: "small", label: "Small capital" },
  { value: "mid", label: "Mid capital" },
  { value: "large", label: "Large capital" }
];

const STYLE_OPTIONS: Array<{ value: TradingStyle; label: string }> = [
  { value: "scalping", label: "Scalping" },
  { value: "intraday", label: "Intraday" },
  { value: "swing", label: "Swing" }
];

type SegmentSelectorProps = {
  capitalBucket: CapitalBucket;
  style: TradingStyle;
  onCapitalBucketChange: (value: CapitalBucket) => void;
  onStyleChange: (value: TradingStyle) => void;
};

export function SegmentSelector({
  capitalBucket,
  style,
  onCapitalBucketChange,
  onStyleChange
}: SegmentSelectorProps) {
  return (
    <section className={styles.segments}>
      <ToggleTabs<CapitalBucket> value={capitalBucket} options={CAPITAL_OPTIONS} onChange={onCapitalBucketChange} ariaLabel="Capital bucket" />
      <ToggleTabs<TradingStyle> value={style} options={STYLE_OPTIONS} onChange={onStyleChange} ariaLabel="Trading style" />
    </section>
  );
}
