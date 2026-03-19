"use client";

import Link from "next/link";
import { useTokenPresence } from "@/shared/auth/useSessionState";

export function AuthNavLinks() {
  const { hasToken, checking } = useTokenPresence();

  if (checking) {
    return <span className="session-badge loading">Syncing...</span>;
  }

  if (!hasToken) {
    return (
      <>
        <Link href="/login">Login</Link>
      </>
    );
  }

  return (
    <>
      <span className="session-badge">Connected</span>
      <Link href="/dashboard-v1">Dashboard</Link>
      <Link href="/trades">Journal</Link>
      <Link href="/pro-analysis">Pro Analysis</Link>
      <Link href="/mt5-status">MT5</Link>
      <Link href="/plans">Plans</Link>
    </>
  );
}
