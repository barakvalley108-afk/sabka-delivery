"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "login" | "signup";

type ApiResponse = {
  error?: string;
  message?: string;
};

export default function CustomerAccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [pincode, setPincode] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const nextPath = searchParams.get("next") || "/";

  useEffect(() => {
    let active = true;

    fetch("/api/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        if (data.user) {
          router.replace(nextPath);
          return;
        }
        setCheckingSession(false);
      })
      .catch(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [nextPath, router]);

  function cleanMobile(value: string) {
    setMobile(value.replace(/\D/g, "").slice(0, 10));
  }

  function cleanPincode(value: string) {
    setPincode(value.replace(/\D/g, "").slice(0, 6));
  }

  function cleanPin(value: string, setter: (value: string) => void) {
    setter(value.replace(/\D/g, "").slice(0, 4));
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setMessage("");
    setPin("");
    setConfirmPin("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (mobile.length !== 10) {
      setMessage("Valid 10-digit mobile number daalo");
      return;
    }

    if (pin.length !== 4) {
      setMessage("4-digit login PIN daalo");
      return;
    }

    if (mode === "signup") {
      if (name.trim().length < 2) {
        setMessage("Apna valid name daalo");
        return;
      }

      if (pincode.length !== 6) {
        setMessage("Valid 6-digit delivery pincode daalo");
        return;
      }

      if (pin !== confirmPin) {
        setMessage("PIN aur Confirm PIN same nahi hain");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch(
        mode === "login" ? "/api/customer-login" : "/api/customer-signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "login"
              ? { mobile, pin }
              : { name: name.trim(), mobile, pincode, pin },
          ),
        },
      );

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.error || data.message || "Request complete nahi hua");
      }

      setMessage(
        mode === "login"
          ? "Login successful. App khul raha hai..."
          : "Account create ho gaya. App khul raha hai...",
      );

      window.location.replace(nextPath.startsWith("/") ? nextPath : "/");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Kuch galat hua. Dobara try karo.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="customer-access-shell">
        <section className="customer-access-card customer-access-loading">
          <img src="/images/sabka-delivery-logo.png" alt="Sabka Delivery" />
          <h1>Sabka Delivery</h1>
          <p>Session check ho raha hai...</p>
          <span className="customer-spinner" />
        </section>
        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="customer-access-shell">
      <section className="customer-access-card">
        <div className="customer-brand">
          <img src="/images/sabka-delivery-logo.png" alt="Sabka Delivery logo" />
          <div>
            <small>FAST • SAFE • LOCAL</small>
            <h1>Sabka Delivery</h1>
            <p>Food, grocery aur daily needs — ek hi app mein.</p>
          </div>
        </div>

        <div className="customer-tabs" role="tablist" aria-label="Customer access">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => switchMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => switchMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={submit}>
          {mode === "signup" && (
            <label>
              <span>Full name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, 60))}
                placeholder="Apna naam daalo"
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            <span>Mobile number</span>
            <div className="mobile-field">
              <b>+91</b>
              <input
                value={mobile}
                onChange={(event) => cleanMobile(event.target.value)}
                placeholder="10-digit mobile number"
                inputMode="numeric"
                autoComplete="tel"
                required
              />
            </div>
          </label>

          {mode === "signup" && (
            <label>
              <span>Delivery pincode</span>
              <input
                value={pincode}
                onChange={(event) => cleanPincode(event.target.value)}
                placeholder="6-digit pincode"
                inputMode="numeric"
                autoComplete="postal-code"
                required
              />
              <small>Sirf admin ke enabled delivery areas mein signup hoga.</small>
            </label>
          )}

          <label>
            <span>{mode === "login" ? "4-digit PIN" : "Create 4-digit PIN"}</span>
            <input
              value={pin}
              onChange={(event) => cleanPin(event.target.value, setPin)}
              placeholder="••••"
              inputMode="numeric"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </label>

          {mode === "signup" && (
            <label>
              <span>Confirm PIN</span>
              <input
                value={confirmPin}
                onChange={(event) => cleanPin(event.target.value, setConfirmPin)}
                placeholder="••••"
                inputMode="numeric"
                type="password"
                autoComplete="new-password"
                required
              />
            </label>
          )}

          {message && (
            <p className={message.toLowerCase().includes("successful") || message.includes("create ho gaya") ? "form-message success" : "form-message"}>
              {message}
            </p>
          )}

          <button className="submit-button" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login & Continue"
                : "Create account"}
          </button>
        </form>

        <p className="customer-note">
          PIN kisi ke saath share mat karo. Sabka Delivery kabhi call ya message par PIN nahi maangega.
        </p>
      </section>
      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  :global(*) { box-sizing: border-box; }
  :global(body) { margin: 0; }
  .customer-access-shell {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px 16px;
    background:
      radial-gradient(circle at 15% 10%, rgba(255, 194, 28, .28), transparent 34%),
      radial-gradient(circle at 88% 88%, rgba(199, 24, 27, .18), transparent 34%),
      #fff9ef;
    font-family: Arial, Helvetica, sans-serif;
    color: #241413;
  }
  .customer-access-card {
    width: min(100%, 460px);
    background: rgba(255,255,255,.97);
    border: 1px solid rgba(199,24,27,.13);
    border-radius: 26px;
    padding: 26px;
    box-shadow: 0 24px 65px rgba(75, 30, 20, .16);
  }
  .customer-brand { display: flex; gap: 14px; align-items: center; margin-bottom: 22px; }
  .customer-brand img, .customer-access-loading img {
    width: 72px;
    height: 72px;
    object-fit: contain;
    border-radius: 18px;
    background: #fff7df;
    border: 1px solid #ffe3a1;
  }
  .customer-brand small { color: #c7181b; font-weight: 800; letter-spacing: .11em; font-size: 10px; }
  .customer-brand h1 { margin: 4px 0 3px; font-size: 27px; line-height: 1; }
  .customer-brand p { margin: 0; color: #755a52; font-size: 13px; line-height: 1.4; }
  .customer-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 5px; background: #f5eee7; border-radius: 15px; margin-bottom: 20px; }
  .customer-tabs button { border: 0; background: transparent; padding: 12px; border-radius: 11px; font-size: 15px; font-weight: 800; cursor: pointer; color: #755a52; }
  .customer-tabs button.active { background: #fff; color: #c7181b; box-shadow: 0 5px 16px rgba(70,35,25,.10); }
  form { display: grid; gap: 15px; }
  label { display: grid; gap: 7px; }
  label > span { font-size: 13px; font-weight: 800; color: #4d312c; }
  label > small { font-size: 11px; color: #80675f; line-height: 1.4; }
  input { width: 100%; border: 1.5px solid #e7d8cf; border-radius: 13px; padding: 14px 14px; font: inherit; font-size: 16px; outline: none; background: #fff; color: #241413; transition: border-color .2s, box-shadow .2s; }
  input:focus { border-color: #c7181b; box-shadow: 0 0 0 4px rgba(199,24,27,.09); }
  .mobile-field { display: grid; grid-template-columns: auto 1fr; align-items: center; border: 1.5px solid #e7d8cf; border-radius: 13px; overflow: hidden; background: #fff; }
  .mobile-field:focus-within { border-color: #c7181b; box-shadow: 0 0 0 4px rgba(199,24,27,.09); }
  .mobile-field b { padding: 0 0 0 14px; color: #63473f; }
  .mobile-field input { border: 0; box-shadow: none; }
  .submit-button { border: 0; border-radius: 14px; padding: 15px 18px; background: linear-gradient(135deg, #d51f22, #a90e12); color: white; font-size: 16px; font-weight: 900; cursor: pointer; box-shadow: 0 10px 24px rgba(199,24,27,.26); }
  .submit-button:disabled { opacity: .65; cursor: wait; }
  .form-message { margin: 0; border-radius: 12px; padding: 11px 12px; background: #fff0ef; color: #a51317; font-size: 13px; font-weight: 700; line-height: 1.4; }
  .form-message.success { background: #edf9ef; color: #176b2c; }
  .customer-note { margin: 18px 0 0; padding-top: 16px; border-top: 1px solid #f0e5de; color: #80675f; font-size: 11px; line-height: 1.5; text-align: center; }
  .customer-access-loading { text-align: center; }
  .customer-access-loading h1 { margin-bottom: 5px; }
  .customer-access-loading p { color: #755a52; }
  .customer-spinner { width: 28px; height: 28px; display: inline-block; border: 3px solid #f0d9d3; border-top-color: #c7181b; border-radius: 50%; animation: spin .7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 520px) {
    .customer-access-shell { align-items: start; padding-top: 18px; }
    .customer-access-card { padding: 21px 18px; border-radius: 22px; }
    .customer-brand img { width: 62px; height: 62px; }
    .customer-brand h1 { font-size: 24px; }
  }
`;
