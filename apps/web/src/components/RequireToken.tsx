"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { getToken } from "@/lib/auth";

type RequireTokenProps = {
  children: ReactNode;
};

export function RequireToken({ children }: RequireTokenProps) {
  const [ready, setReady] = useState<boolean>(false);
  const [hasToken, setHasToken] = useState<boolean>(false);

  useEffect(() => {
    setHasToken(Boolean(getToken()));
    setReady(true);
  }, []);

  if (!ready) {
    return <p>Loading...</p>;
  }

  if (!hasToken) {
    return (
      <section>
        <p>No token found. Save a token first.</p>
        <Link href="/api-test">Go to API test</Link>
      </section>
    );
  }

  return <>{children}</>;
}
