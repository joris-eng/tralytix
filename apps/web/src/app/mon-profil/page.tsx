"use client";

import { useRouter } from "next/navigation";
import { AuthGate } from "@/shared/auth/AuthGate";
import { useRequireAuth } from "@/shared/auth/useSessionState";
import { ProfileScreen } from "@/features/profile/ui/ProfileScreen";

export default function MonProfilPage() {
  const router = useRouter();
  const { isAuthenticated, checkingSession } = useRequireAuth(router);

  return (
    <AuthGate checkingSession={checkingSession} isAuthenticated={isAuthenticated}>
      <ProfileScreen />
    </AuthGate>
  );
}
