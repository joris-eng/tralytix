"use client";

import { useEffect } from "react";
import type { Notification } from "@/shared/notifications/mockNotifications";
import styles from "@/shared/notifications/notifications.module.css";

type Props = {
  notifications: Notification[];
  onClose: () => void;
};

function NotifIcon({ type }: { type: Notification["type"] }) {
  if (type === "opportunity") return <span>⚡</span>;
  if (type === "warning") return <span>⚠</span>;
  return <span>ℹ</span>;
}

function iconClass(type: Notification["type"]) {
  if (type === "opportunity") return styles.iconOpportunity;
  if (type === "warning") return styles.iconWarning;
  return styles.iconInfo;
}

export function NotificationPanel({ notifications, onClose }: Props) {
  const unread = notifications.filter((n) => !n.read).length;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop click to close */}
      <div className={styles.overlay} onClick={onClose} />

      <aside className={styles.panel} role="dialog" aria-label="Notifications">
        {/* Header */}
        <div className={styles.panelHeader}>
          <div className={styles.panelTitleBlock}>
            <h2 className={styles.panelTitle}>Alertes en temps réel</h2>
            <div className={styles.panelLive}>
              <span className={styles.liveDot} />
              LIVE UPDATES
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        {/* Create alert CTA */}
        <button type="button" className={styles.createBtn}>
          <span>+ Créer une alerte</span>
          {unread > 0 && <span className={styles.createBtnCount}>{unread}</span>}
        </button>

        {/* List */}
        <div className={styles.list} role="list">
          {notifications.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🔔</span>
              <span>Aucune alerte pour le moment.</span>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                role="listitem"
                className={[
                  styles.item,
                  !notif.read ? styles.itemUnread : styles.itemRead,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className={[styles.itemIcon, iconClass(notif.type)].join(" ")}>
                  <NotifIcon type={notif.type} />
                </div>
                <div className={styles.itemContent}>
                  <p className={styles.itemTitle}>{notif.title}</p>
                  <p className={styles.itemBody}>{notif.body}</p>
                  <span className={styles.itemTime}>{notif.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
