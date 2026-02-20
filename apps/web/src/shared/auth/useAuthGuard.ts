"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@/shared/auth/token";

const PUBLIC_PATHS = new Set<string>(["/login"]);

export function useAuthGuard(): { isAuthenticated: boolean } {
  const router = useRouter();
  const pathname = usePathname();
  const token = getToken();
  const isAuthenticated = Boolean(token);

  useEffect(() => {
    if (!PUBLIC_PATHS.has(pathname) && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, pathname, router]);

  return { isAuthenticated };
}

