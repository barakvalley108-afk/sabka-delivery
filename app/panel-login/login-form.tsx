"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/panel-auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Login failed");
      setBusy(false);
      return;
    }
    location.href = result.route;
  }
  return (
    <main className="panel-login-page">
      <section className="panel-login-card">
        <Link href="/" className="panel-login-brand">
          <img src="/images/sabka-delivery-logo.png" alt="SABKA DELIVERY" />
          <span>
            SABKA DELIVERY<small>OPERATIONS CLOUD</small>
          </span>
        </Link>
        <div className="login-badge">PRIVATE ACCESS</div>
        <h1>Welcome back</h1>
        <p>Admin, Restaurant, Grocery, Electronics aur Rider panel ka secure login.</p>
        <form onSubmit={submit}>
          <label>
            Panel User ID
            <input
              name="username"
              autoComplete="username"
              required
              placeholder="Enter your user ID"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter password"
            />
          </label>
          {error && <strong className="login-error">{error}</strong>}
          <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <Link href="/">← Back to customer website</Link>
      </section>
      <aside>
        <span>LIVE OPERATIONS</span>
        <h2>One system. Every delivery.</h2>
        <p>
          Orders, menus, inventory, riders aur payments—sab ek connected
          workflow mein.
        </p>
      </aside>
    </main>
  );
}
