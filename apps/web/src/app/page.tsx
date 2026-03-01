"use client";

import { useRouter } from "next/navigation";
import { HealthVersionCard } from "@/features/health/ui/HealthVersionCard";
import { Mt5StatusCard } from "@/features/mt5/ui/Mt5StatusCard";
import { Mt5ImportCard } from "@/features/mt5/ui/Mt5ImportCard";
import { TradesCard } from "@/features/trades/ui/TradesCard";
import { AnalyticsCard } from "@/features/analytics/ui/AnalyticsCard";
import { MarketdataCard } from "@/features/marketdata/ui/MarketdataCard";
import { AuthGate } from "@/shared/auth/AuthGate";
import { useRequireAuth } from "@/shared/auth/useSessionState";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, checkingSession } = useRequireAuth(router);

  return (
    <AuthGate
      checkingSession={checkingSession}
      isAuthenticated={isAuthenticated}
      checkingFallback={
        <section className="card">
          <h1>Tralytix Dashboard</h1>
          <p className="muted">Checking session...</p>
          <div className="skeleton-line" />
        </section>
      }
    >
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
    </AuthGate>
  );
}
