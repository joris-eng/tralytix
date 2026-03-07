"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthSessionContext } from "@/shared/auth/AuthSessionProvider";
import { useIsPro } from "@/shared/auth/useSessionState";
import { Skeleton } from "@/features/ui/primitives";
import styles from "@/shared/auth/requirePro.module.css";

type RequireProProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function RequirePro({ children, fallback }: RequireProProps) {
  const router = useRouter();
  const { checkingSession, isAuthenticated } = useAuthSessionContext();
  const isPro = useIsPro();

  if (checkingSession) {
    return <Skeleton height={180} />;
  }

  if (!isAuthenticated || !isPro) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className={styles.gate}>
        <div className={styles.lockIcon} aria-hidden>🔒</div>
        <h3 className={styles.title}>Pro Feature</h3>
        <p className={styles.subtitle}>
          Upgrade to Pro to unlock detailed analytics, insights, and trade breakdown.
        </p>
        <button
          type="button"
          className={styles.cta}
          onClick={() => router.push("/plans")}
        >
          Upgrade to Pro →
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
