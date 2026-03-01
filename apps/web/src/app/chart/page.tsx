"use client";

import { useRouter } from "next/navigation";
import { ChartView } from "@/features/chart/ChartView";
import { AuthGate } from "@/shared/auth/AuthGate";
import { useRequireAuth } from "@/shared/auth/useSessionState";

export default function ChartPage() {
  const router = useRouter();
  const { isAuthenticated, checkingSession } = useRequireAuth(router);

  return (
    <AuthGate checkingSession={checkingSession} isAuthenticated={isAuthenticated}>
      <ChartView />
    </AuthGate>
  );
}
