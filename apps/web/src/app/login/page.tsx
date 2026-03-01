"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/auth";
import { fetchAuthMe } from "@/lib/authApi";

type DevLoginResponse = {
  token: string;
};

function formatUnknown(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function LoginPage() {
  const router = useRouter();
  const isProduction = process.env.NODE_ENV === "production";
  const [checkingSession, setCheckingSession] = useState<boolean>(true);
  const [email, setEmail] = useState<string>(
    process.env.NODE_ENV === "development" ? "dev@tralytix.com" : ""
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorPayload, setErrorPayload] = useState<string>("");

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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setErrorPayload("");

    try {
      const response = await apiFetch<DevLoginResponse>("/v1/auth/dev-login", {
        method: "POST",
        body: { email: email.trim() }
      });
      setToken(response.token);
      router.push("/trades");
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        if (error.status === 403) {
          setErrorMessage("Dev login is disabled on this environment.");
        } else {
          setErrorMessage(`Error ${error.status}: ${error.message}`);
        }
        if (error.payload !== undefined) {
          setErrorPayload(formatUnknown(error.payload));
        }
      } else {
        setErrorMessage("Unable to login");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Login (dev)</h1>
      <p className="muted">Dev login can be disabled by backend configuration in production.</p>
      {checkingSession ? <p className="muted">Checking active session...</p> : null}
      <form onSubmit={(event) => void onSubmit(event)}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="dev@tralytix.com"
        />
        <button type="submit" disabled={checkingSession || loading || !email.trim()}>
          {loading ? "Loading..." : "Login (dev)"}
        </button>
      </form>
      {errorMessage ? <p>{errorMessage}</p> : null}
      {errorPayload ? <pre>{errorPayload}</pre> : null}
      {!isProduction ? (
        <p>
          Need raw API checks? <Link href="/api-test">Go to /api-test</Link>
        </p>
      ) : null}
    </main>
  );
}
