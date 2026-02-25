"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import { setToken } from "@/lib/auth";

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
  const [email, setEmail] = useState<string>(
    process.env.NODE_ENV === "development" ? "dev@tralytix.com" : ""
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorPayload, setErrorPayload] = useState<string>("");

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
        setErrorMessage(`Error ${error.status}: ${error.message}`);
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
      <form onSubmit={(event) => void onSubmit(event)}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="dev@tralytix.com"
        />
        <button type="submit" disabled={loading || !email.trim()}>
          {loading ? "Loading..." : "Login (dev)"}
        </button>
      </form>
      {errorMessage ? <p>{errorMessage}</p> : null}
      {errorPayload ? <pre>{errorPayload}</pre> : null}
      <p>
        Need raw API checks? <Link href="/api-test">Go to /api-test</Link>
      </p>
    </main>
  );
}
