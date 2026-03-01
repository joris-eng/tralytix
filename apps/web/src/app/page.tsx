"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HealthVersionCard } from "@/features/health/ui/HealthVersionCard";
import { Mt5StatusCard } from "@/features/mt5/ui/Mt5StatusCard";
import { Mt5ImportCard } from "@/features/mt5/ui/Mt5ImportCard";
import { TradesCard } from "@/features/trades/ui/TradesCard";
import { AnalyticsCard } from "@/features/analytics/ui/AnalyticsCard";
import { MarketdataCard } from "@/features/marketdata/ui/MarketdataCard";
import { fetchAuthMe } from "@/lib/authApi";
import { clearToken, getToken } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        await fetchAuthMe(token);
        if (!cancelled) {
          setIsAuthenticated(true);
          setCheckingSession(false);
        }
      } catch {
        clearToken();
        router.replace("/login");
      }
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checkingSession) {
    return (
      <section className="card">
        <h1>Tralytix Dashboard</h1>
        <p className="muted">Checking session...</p>
        <div className="skeleton-line" />
      </section>
    );
  }

  if (!isAuthenticated) {
    return <p className="muted">Redirecting to login...</p>;
  }

  return (
    <section className="row" style={{ flexDirection: "column" }}>
      <section className="card">
        <h1>Tralytix Dashboard</h1>
        <p className="muted">MVP UI wired to backend endpoints via modular feature architecture.</p>
      </section>
      <HealthVersionCard />
      <Mt5StatusCard />
      <Mt5ImportCard />
      <TradesCard />
      <AnalyticsCard />
      <MarketdataCard />
    </section>
  );
}
