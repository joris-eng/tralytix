"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useDevLogin } from "@/features/auth/hooks";
import { getToken } from "@/shared/auth/token";
import { ApiError } from "@/shared/ui/ApiError";

export function DevLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("dev@local.test");
  const { login, loading, error, token } = useDevLogin();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await login(email);
    router.replace("/");
  }

  return (
    <section className="card">
      <h1>Dev Login</h1>
      <p className="muted">Use any valid email to get a dev token.</p>
      {getToken() ? <p className="muted">A token already exists in localStorage.</p> : null}
      <form className="row" onSubmit={onSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <button className="primary" disabled={loading} type="submit">
          {loading ? "Loading..." : "Dev Login"}
        </button>
      </form>
      {error ? <ApiError message={error} /> : null}
      {token ? <p className="muted">Token saved in localStorage.</p> : null}
    </section>
  );
}
