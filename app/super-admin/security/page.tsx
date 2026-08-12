"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function OwnerSecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmPassword) {
      setError("New password aur confirm password same rakho");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/panel-auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "Password change failed");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Owner password successfully change ho gaya.");
    } catch {
      setError("Network problem. Dobara try karo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="owner-security-page">
      <section className="owner-security-card">
        <div className="owner-security-brand">
          <img src="/images/sabka-delivery-logo.png" alt="Sabka Delivery" />
          <div>
            <small>SABKA DELIVERY · OWNER SECURITY</small>
            <h1>Admin password</h1>
          </div>
        </div>
        <p className="owner-security-note">
          Owner account se admin panel ka password securely change karo. Customer login/signup isse affected nahi hoga.
        </p>
        <form onSubmit={submit}>
          <label>
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          {error && <p className="owner-security-error">{error}</p>}
          {message && <p className="owner-security-success">{message}</p>}
          <button disabled={busy}>{busy ? "Updating…" : "Change admin password"}</button>
        </form>
        <Link className="owner-security-back" href="/super-admin">← Back to Owner Dashboard</Link>
      </section>
      <style jsx>{`
        .owner-security-page{min-height:100vh;display:grid;place-items:center;padding:28px;background:linear-gradient(135deg,#0b1510,#17271e);font-family:Arial,sans-serif}
        .owner-security-card{width:min(520px,100%);padding:30px;border:1px solid #d8b85d33;border-radius:24px;background:#fff;color:#17231d;box-shadow:0 28px 80px #0008}
        .owner-security-brand{display:flex;align-items:center;gap:14px}
        .owner-security-brand img{width:56px;height:56px;border-radius:16px;object-fit:contain}
        .owner-security-brand small{color:#c58a12;font-size:9px;font-weight:900;letter-spacing:1.6px}
        h1{margin:5px 0 0;font-size:28px;letter-spacing:-1px}
        .owner-security-note{color:#6c7a72;font-size:12px;line-height:1.6;margin:20px 0}
        form{display:grid;gap:15px}
        label{display:grid;gap:7px;font-size:11px;font-weight:900}
        input{height:44px;padding:0 12px;border:1px solid #dbe3dd;border-radius:10px;outline:0;font-size:13px}
        input:focus{border-color:#c58a12;box-shadow:0 0 0 3px #c58a1218}
        button{height:46px;border:0;border-radius:11px;background:#172a20;color:#fff;font-weight:900;cursor:pointer}
        button:disabled{opacity:.6;cursor:wait}
        .owner-security-error,.owner-security-success{padding:10px 12px;border-radius:10px;font-size:11px;font-weight:800;margin:0}
        .owner-security-error{background:#fff0f1;color:#b21522}
        .owner-security-success{background:#eaf8ee;color:#08713a}
        .owner-security-back{display:block;margin-top:18px;color:#9a6d0e;font-size:11px;font-weight:900;text-decoration:none}
      `}</style>
    </main>
  );
}
