"use client";

import { useTokenPresence } from "@/shared/auth/useSessionState";
import { LogoutButton } from "@/features/auth/ui/LogoutButton";
import styles from "@/features/auth/ui/nav.module.css";

export function NavRight() {
  const { hasToken, checking } = useTokenPresence();

  if (checking) return null;

  return (
    <div className={styles.navRight}>
      <div className={styles.langSelector}>
        <span className={styles.langFlag}>🇫🇷</span>
        <span className={styles.langLabel}>Français</span>
      </div>

      {hasToken && (
        <>
          <div className={styles.connectedBadge}>
            <span className={styles.connectedDot} />
            Connected
          </div>
          <LogoutButton />
        </>
      )}
    </div>
  );
}
