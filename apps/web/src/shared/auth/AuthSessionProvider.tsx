"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { fetchAuthMe } from "@/lib/authApi";

type AuthConfigResponse = {
  dev_login_enabled?: boolean;
};

type AuthSessionContextValue = {
  checkingSession: boolean;
  isAuthenticated: boolean;
  loadingAuthConfig: boolean;
  devLoginEnabled: boolean;
  userPlan: "free" | "pro" | "elite";
  refreshSession: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuthConfig, setLoadingAuthConfig] = useState(true);
  const [devLoginEnabled, setDevLoginEnabled] = useState(true);
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "elite">("free");

  const refreshSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setIsAuthenticated(false);
      setUserPlan("free");
      setCheckingSession(false);
      return;
    }

    try {
      const me = await fetchAuthMe(token);
      if (me.plan === "elite") setUserPlan("elite");
      else if (me.plan === "pro") setUserPlan("pro");
      else setUserPlan("free");
      setIsAuthenticated(true);
    } catch {
      clearToken();
      setIsAuthenticated(false);
      setUserPlan("free");
    } finally {
      setCheckingSession(false);
    }
  }, []);

  const loadAuthConfig = useCallback(async () => {
    try {
      const config = await apiFetch<AuthConfigResponse>("/v1/auth/config");
      setDevLoginEnabled(config.dev_login_enabled !== false);
    } catch {
      setDevLoginEnabled(true);
    } finally {
      setLoadingAuthConfig(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
    void loadAuthConfig();

    const onFocus = () => {
      void refreshSession();
    };
    const onStorage = () => {
      void refreshSession();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadAuthConfig, refreshSession]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      checkingSession,
      isAuthenticated,
      loadingAuthConfig,
      devLoginEnabled,
      userPlan,
      refreshSession
    }),
    [checkingSession, isAuthenticated, loadingAuthConfig, devLoginEnabled, userPlan, refreshSession]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSessionContext(): AuthSessionContextValue {
  const value = useContext(AuthSessionContext);
  if (!value) {
    throw new Error("useAuthSessionContext must be used within AuthSessionProvider");
  }
  return value;
}
