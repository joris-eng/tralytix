"use client";

import { useState, useEffect } from "react";
import styles from "@/shared/export/exportReport.module.css";

type Section = {
  id: string;
  label: string;
  icon: string;
};

const SECTIONS: Section[] = [
  { id: "performance", label: "Performance Summary", icon: "↗" },
  { id: "equity",      label: "Equity Curve",        icon: "📊" },
  { id: "insights",    label: "Top Insights",         icon: "💡" },
  { id: "breakdown",   label: "Trade Breakdown",      icon: "≡" },
];

type Props = {
  onClose: () => void;
};

function currentPeriod() {
  return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function ExportReportModal({ onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(SECTIONS.map((s) => s.id))
  );
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function toggleSection(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleDownload() {
    setDownloading(true);
    // Simulate generation delay
    await new Promise((r) => setTimeout(r, 1500));
    setDone(true);
    setDownloading(false);
    setTimeout(() => onClose(), 1200);
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>📄</div>
          <div className={styles.modalTitleBlock}>
            <h2 className={styles.modalTitle}>Export Monthly Report</h2>
            <span className={styles.modalPeriod}>{currentPeriod()}</span>
          </div>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <div>
            <p className={styles.sectionsLabel}>Report Sections</p>
            <div className={styles.sectionsList}>
              {SECTIONS.map((sec) => (
                <div
                  key={sec.id}
                  className={styles.sectionRow}
                  onClick={() => toggleSection(sec.id)}
                  role="checkbox"
                  aria-checked={selected.has(sec.id)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === " " && toggleSection(sec.id)}
                >
                  <div className={styles.sectionRowIcon}>{sec.icon}</div>
                  <span className={styles.sectionRowLabel}>{sec.label}</span>
                  <div
                    className={[
                      styles.toggle,
                      selected.has(sec.id) ? styles.toggleOn : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {selected.has(sec.id) && <div className={styles.toggleOnDot} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.infoBox}>
            <span className={styles.infoBoxIcon}>📄</span>
            <span className={styles.infoBoxText}>
              Your PDF report will include all performance metrics, charts, and insights for
              the selected period.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.downloadBtn}
            onClick={handleDownload}
            disabled={downloading || done || selected.size === 0}
          >
            {done ? (
              <>✓ Report Ready</>
            ) : downloading ? (
              <>Generating…</>
            ) : (
              <>⬇ Download PDF</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
