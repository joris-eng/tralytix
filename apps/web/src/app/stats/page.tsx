"use client";

import { useRouter } from "next/navigation";
import { StatsCards } from "@/features/stats/StatsCards";
import { AuthGate } from "@/shared/auth/AuthGate";
import { useRequireAuth } from "@/shared/auth/useSessionState";

export default function StatsPage() {
  const router = useRouter();
  const { isAuthenticated, checkingSession } = useRequireAuth(router);

  return (
    <AuthGate checkingSession={checkingSession} isAuthenticated={isAuthenticated}>
      <StatsCards />
    </AuthGate>
  );
}
