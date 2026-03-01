"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

export function AuthNavLinks() {
  const [hasToken, setHasToken] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const sync = () => {
      setHasToken(Boolean(getToken()));
      setChecking(false);
    };
    sync();

    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

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
