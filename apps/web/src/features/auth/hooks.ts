"use client";

import { useState } from "react";
import { clearToken } from "@/lib/auth";
import { devLogin } from "@/features/auth/api";

export function useDevLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setTokenValue] = useState<string | null>(null);

  const login = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await devLogin(email);
      setTokenValue(response.token);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    setTokenValue(null);
  };

  return { login, logout, loading, error, token };
}

