"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { fetchAuthMe } from "@/lib/authApi";

type AuthConfigResponse = {
  dev_login_enabled?: boolean;
};

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
  const [hasToken, setHasToken] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const sync = () => {
      setHasToken(Boolean(getToken()));
      setChecking(false);
    };
    sync();

    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return { hasToken, checking };
}

export function useRedirectIfAuthenticated(router: RouterLike): { checkingSession: boolean } {
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function ensureAnonymousLogin() {
      const token = getToken();
      if (!token) {
        if (!cancelled) {
          setCheckingSession(false);
        }
        return;
      }

      try {
        await fetchAuthMe(token);
        if (!cancelled) {
          router.replace("/");
        }
      } catch {
        clearToken();
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    void ensureAnonymousLogin();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return { checkingSession };
}

export function useRequireAuth(router: RouterLike): { isAuthenticated: boolean; checkingSession: boolean } {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        if (!cancelled) {
          setCheckingSession(false);
        }
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
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return { isAuthenticated, checkingSession };
}

export function useAuthConfig(): AuthConfigState {
  const [loading, setLoading] = useState(true);
  const [devLoginEnabled, setDevLoginEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAuthConfig() {
      try {
        const config = await apiFetch<AuthConfigResponse>("/v1/auth/config");
        if (!cancelled) {
          setDevLoginEnabled(config.dev_login_enabled !== false);
        }
      } catch {
        if (!cancelled) {
          setDevLoginEnabled(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAuthConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  return { devLoginEnabled, loading };
}
