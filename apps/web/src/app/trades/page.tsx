"use client";

import { useRouter } from "next/navigation";
import { AuthGate } from "@/shared/auth/AuthGate";
import { useRequireAuth } from "@/shared/auth/useSessionState";
import { JournalScreen } from "@/features/journal/ui/JournalScreen";

export default function TradesPage() {
  const router = useRouter();
  const { isAuthenticated, checkingSession } = useRequireAuth(router);

  return (
    <AuthGate checkingSession={checkingSession} isAuthenticated={isAuthenticated}>
      <JournalScreen />
    </AuthGate>
  );
}
