"use client";

import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";
import { useTokenPresence } from "@/shared/auth/useSessionState";

export function LogoutButton() {
  const router = useRouter();
  const { hasToken, checking } = useTokenPresence();

  const onLogout = () => {
    clearToken();
    router.replace("/login");
  };

  if (checking) {
    return null;
  }

  if (!hasToken) {
    return null;
  }

  return (
    <button onClick={onLogout} type="button">
      Logout
    </button>
  );
}

