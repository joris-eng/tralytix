"use client";

import type { ReactNode } from "react";
import { RequirePlan } from "@/shared/auth/RequirePlan";

type RequireProProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

/** @deprecated Use <RequirePlan requiredPlan="pro"> instead */
export function RequirePro({ children, fallback }: RequireProProps) {
  return (
    <RequirePlan requiredPlan="pro" fallback={fallback}>
      {children}
    </RequirePlan>
  );
}
