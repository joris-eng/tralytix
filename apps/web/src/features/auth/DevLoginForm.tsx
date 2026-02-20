"use client";

import { FormEvent, useState } from "react";
import { devLogin } from "@/lib/auth/authService";

export function DevLoginForm() {
  const [email, setEmail] = useState("dev@local.test");
  const [loading, setLoading] = useState(false);
  const [token, setLocalToken] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await devLogin(email);
      setLocalToken(response.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h1>Dev Login</h1>
      <p className="muted">Use any valid email to get a dev token.</p>
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
      {error ? <p className="error">{error}</p> : null}
      {token ? <p className="muted">Token saved in localStorage.</p> : null}
    </section>
  );
}
