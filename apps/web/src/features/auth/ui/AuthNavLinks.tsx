"use client";

import Link from "next/link";
import { useTokenPresence } from "@/shared/auth/useSessionState";

export function AuthNavLinks() {
  const { hasToken, checking } = useTokenPresence();

  if (checking) {
    return <span className="session-badge loading">Checking...</span>;
  }

  if (!hasToken) {
    return (
      <>
        <span className="session-badge">Guest</span>
        <Link href="/login">Login</Link>
      </>
    );
  }

  return (
    <>
      <span className="session-badge">Connected</span>
      <Link href="/">Dashboard</Link>
      <Link href="/mt5-status">MT5 Status</Link>
      <Link href="/chart">Chart</Link>
      <Link href="/stats">Stats</Link>
    </>
  );
}
