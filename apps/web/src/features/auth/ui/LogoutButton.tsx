"use client";

import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";

export function LogoutButton() {
  const router = useRouter();

  const onLogout = () => {
    clearToken();
    router.replace("/login");
  };

  return (
    <button onClick={onLogout} type="button">
      Logout
    </button>
  );
}

