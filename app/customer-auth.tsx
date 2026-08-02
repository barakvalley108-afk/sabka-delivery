"use client";

import { useEffect, useState } from "react";

type User = { id: number; mobile: string; name: string | null };

export default function CustomerAuth() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerPage, setCustomerPage] = useState(false);

  useEffect(() => {
    setCustomerPage(window.location.pathname === "/");
    fetch("/api/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setUser(data.user || null))
      .catch(() => {});
  }, []);

  if (!customerPage) return null;

  const resetFlow = (nextMode: "login" | "signup") => {
    setMode(nextMode);
    setChallengeId("");
    setOtp("");
    setMessage("");
  };

  async function requestOtp() {
    setMessage("");
    if (mode === "signup" && name.trim().length < 2) {
      setMessage("Signup ke liye apna naam daalo");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setMessage("Valid 10-digit mobile number daalo");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "OTP send nahi hua");
      setChallengeId(data.challengeId);
      setMessage("OTP SMS bhej diya gaya");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "OTP send nahi hua");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setMessage("");
    if (!/^\d{6}$/.test(otp)) {
      setMessage("6-digit OTP daalo");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, mobile, otp, name: mode === "signup" ? name.trim() : undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "OTP verify nahi hua");
      setUser(data.user);
      setOpen(false);
      setChallengeId("");
      setOtp("");
      setMessage("");
      window.dispatchEvent(new Event("sabka-auth-changed"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "OTP verify nahi hua");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="customer-auth-trigger" onClick={() => setOpen(true)}>
        {user ? `👤 ${user.name || user.mobile}` : "👤 Login / Signup"}
      </button>

      {open && (
        <div className="customer-auth-overlay" onClick={() => setOpen(false)}>
          <section className="customer-auth-card" onClick={(event) => event.stopPropagation()}>
            <button className="customer-auth-close" onClick={() => setOpen(false)}>×</button>
            <img src="/images/sabka-delivery-logo.png" alt="Sabka Delivery" />
            <h2>{mode === "login" ? "Customer Login" : "Create Account"}</h2>
            <p>{challengeId ? "Mobile par aaya OTP daalo" : "Mobile number se continue karo"}</p>

            {!challengeId && (
              <div className="customer-auth-tabs">
                <button className={mode === "login" ? "active" : ""} onClick={() => resetFlow("login")}>Login</button>
                <button className={mode === "signup" ? "active" : ""} onClick={() => resetFlow("signup")}>Signup</button>
              </div>
            )}

            {mode === "signup" && !challengeId && (
              <label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>
            )}

            <label>Mobile Number<input value={mobile} disabled={!!challengeId} onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="10-digit mobile number" /></label>

            {challengeId && (
              <label>OTP<input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="6-digit OTP" /></label>
            )}

            {message && <div className="customer-auth-message">{message}</div>}

            <button className="customer-auth-primary" disabled={loading} onClick={challengeId ? verifyOtp : requestOtp}>
              {loading ? "Please wait…" : challengeId ? "Verify & Continue" : "Send OTP"}
            </button>

            {challengeId && <button className="customer-auth-back" onClick={() => { setChallengeId(""); setOtp(""); setMessage(""); }}>← Change mobile number</button>}
          </section>
        </div>
      )}
    </>
  );
}
