"use client";

import { useState } from "react";
import { NotificationPanel } from "@/shared/notifications/NotificationPanel";
import { MOCK_NOTIFICATIONS } from "@/shared/notifications/mockNotifications";
import styles from "@/shared/notifications/notifications.module.css";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <>
      <button
        type="button"
        className={[styles.bellBtn, open ? styles.bellBtnActive : ""].filter(Boolean).join(" ")}
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        {/* Bell SVG */}
        <svg className={styles.bellIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className={styles.badge}>{unread}</span>}
      </button>

      {open && (
        <NotificationPanel
          notifications={MOCK_NOTIFICATIONS}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
