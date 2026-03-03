"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthSessionContext } from "@/shared/auth/AuthSessionProvider";
import { useIsPro } from "@/shared/auth/useSessionState";
import { Button, Heading, Skeleton, Text } from "@/features/ui/primitives";

type RequireProProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function RequirePro({ children, fallback }: RequireProProps) {
  const router = useRouter();
  const { checkingSession, isAuthenticated } = useAuthSessionContext();
  const isPro = useIsPro();

  if (checkingSession) {
    return <Skeleton height={180} />;
  }

  if (!isAuthenticated || !isPro) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="ui-card" style={{ textAlign: "center", padding: "2rem" }}>
        <Heading>Pro Feature</Heading>
        <Text className="ui-text-muted">Upgrade to Pro to access this feature.</Text>
        <div style={{ marginTop: 12 }}>
          <Button variant="primary" onClick={() => router.push("/plans")}>
            Upgrade to Pro
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
