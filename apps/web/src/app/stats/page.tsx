"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatsCards } from "@/features/stats/StatsCards";
import { fetchAuthMe } from "@/lib/authApi";
import { clearToken, getToken } from "@/lib/auth";

export default function StatsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        await fetchAuthMe(token);
        if (!cancelled) {
          setIsAuthenticated(true);
        }
      } catch {
        clearToken();
        router.replace("/login");
      }
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!isAuthenticated) {
    return <p className="muted">Redirecting to login...</p>;
  }

  return <StatsCards />;
}
