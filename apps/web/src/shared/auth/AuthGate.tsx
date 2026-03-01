"use client";

import type { ReactNode } from "react";

type AuthGateProps = {
  checkingSession: boolean;
  isAuthenticated: boolean;
  children: ReactNode;
  checkingFallback?: ReactNode;
  unauthenticatedFallback?: ReactNode;
};

export function AuthGate({
  checkingSession,
  isAuthenticated,
  children,
  checkingFallback,
  unauthenticatedFallback
}: AuthGateProps) {
  if (checkingSession) {
    return checkingFallback ?? <p className="muted">Checking session...</p>;
  }

  if (!isAuthenticated) {
    return unauthenticatedFallback ?? <p className="muted">Redirecting to login...</p>;
  }

  return <>{children}</>;
}
