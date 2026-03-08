"use client";

import { useEffect } from "react";
import { useAuthSessionContext } from "@/shared/auth/AuthSessionProvider";

type TokenPresenceState = {
  hasToken: boolean;
  checking: boolean;
};

type AuthConfigState = {
  devLoginEnabled: boolean;
  loading: boolean;
};

type RouterLike = {
  replace: (href: string) => void;
};

export function useTokenPresence(): TokenPresenceState {
  const { isAuthenticated, checkingSession } = useAuthSessionContext();
  return { hasToken: isAuthenticated, checking: checkingSession };
}

export function useRedirectIfAuthenticated(router: RouterLike): { checkingSession: boolean } {
  const { isAuthenticated, checkingSession } = useAuthSessionContext();

  useEffect(() => {
    if (!checkingSession && isAuthenticated) {
      router.replace("/");
    }
  }, [checkingSession, isAuthenticated, router]);

  return { checkingSession };
}

export function useRequireAuth(router: RouterLike): { isAuthenticated: boolean; checkingSession: boolean } {
  const { isAuthenticated, checkingSession } = useAuthSessionContext();

  useEffect(() => {
    if (!checkingSession && !isAuthenticated) {
      router.replace("/login");
    }
  }, [checkingSession, isAuthenticated, router]);

  return { isAuthenticated, checkingSession };
}

export function useAuthConfig(): AuthConfigState {
  const { devLoginEnabled, loadingAuthConfig } = useAuthSessionContext();
  return { devLoginEnabled, loading: loadingAuthConfig };
}

export function usePlan(): "free" | "pro" | "elite" {
  const { userPlan } = useAuthSessionContext();
  return userPlan;
}

export function useIsPro(): boolean {
  const { userPlan } = useAuthSessionContext();
  return userPlan === "pro" || userPlan === "elite";
}

export function useIsElite(): boolean {
  const { userPlan } = useAuthSessionContext();
  return userPlan === "elite";
}
