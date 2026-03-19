"use client";

import { useRouter } from "next/navigation";
import { AuthGate } from "@/shared/auth/AuthGate";
import { useRequireAuth } from "@/shared/auth/useSessionState";
import { RevisionScreen } from "@/features/revision/ui/RevisionScreen";

export default function RevisionPage() {
  const router = useRouter();
  const { isAuthenticated, checkingSession } = useRequireAuth(router);

  return (
    <AuthGate checkingSession={checkingSession} isAuthenticated={isAuthenticated}>
      <RevisionScreen />
    </AuthGate>
  );
}
