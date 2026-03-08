"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthSessionContext } from "@/shared/auth/AuthSessionProvider";
import { usePlan } from "@/shared/auth/useSessionState";
import { Skeleton } from "@/features/ui/primitives";
import styles from "@/shared/auth/requirePro.module.css";

type RequiredPlan = "pro" | "elite";

type RequirePlanProps = {
  requiredPlan: RequiredPlan;
  children: ReactNode;
  fallback?: ReactNode;
};

function planLevel(plan: string): number {
  if (plan === "elite") return 2;
  if (plan === "pro") return 1;
  return 0;
}

export function RequirePlan({ requiredPlan, children, fallback }: RequirePlanProps) {
  const router = useRouter();
  const { checkingSession, isAuthenticated } = useAuthSessionContext();
  const currentPlan = usePlan();

  if (checkingSession) {
    return <Skeleton height={180} />;
  }

  const hasAccess = isAuthenticated && planLevel(currentPlan) >= planLevel(requiredPlan);

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;

    const isEliteRequired = requiredPlan === "elite";

    return (
      <div className={styles.gate}>
        <div className={styles.lockIcon} aria-hidden>🔒</div>
        <h3 className={styles.title}>
          {isEliteRequired ? "Fonctionnalité Elite" : "Fonctionnalité Pro"}
        </h3>
        <p className={styles.subtitle}>
          {isEliteRequired
            ? "Passez au plan Elite pour accéder à cette fonctionnalité avancée."
            : "Passez au plan Pro pour accéder aux analyses détaillées, insights et trade breakdown."}
        </p>
        <button
          type="button"
          className={styles.cta}
          onClick={() => router.push("/plans")}
        >
          {isEliteRequired ? "Passer à Elite →" : "Passer à Pro →"}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
