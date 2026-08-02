"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomerSessionGuard() {
  const [invalid, setInvalid] = useState(false);
  const checking = useRef(false);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      if (!active || checking.current || document.hidden) return;
      checking.current = true;
      try {
        const response = await fetch("/api/me", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          sessionInvalid?: boolean;
          reason?: string;
        };
        if (active && data.sessionInvalid && data.reason === "ANOTHER_DEVICE") {
          setInvalid(true);
        }
      } catch {
        // Temporary network errors must not log the customer out.
      } finally {
        checking.current = false;
      }
    };

    const wake = () => {
      if (!document.hidden) void checkSession();
    };

    const first = window.setTimeout(checkSession, 1500);
    const timer = window.setInterval(checkSession, 10000);
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);

    return () => {
      active = false;
      window.clearTimeout(first);
      window.clearInterval(timer);
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, []);

  if (!invalid) return null;

  return (
    <div className="session-invalid-overlay" role="alertdialog" aria-modal="true">
      <section>
        <span>!</span>
        <h2>Login in another device</h2>
        <p>Aapka account kisi dusre device par login hua hai. Continue karne ke liye dobara login karein.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Login again
        </button>
      </section>
      <style jsx>{`
        .session-invalid-overlay {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(20, 12, 10, 0.72);
          backdrop-filter: blur(8px);
        }
        section {
          width: min(420px, 100%);
          padding: 28px 22px;
          border-radius: 24px;
          background: #fff;
          text-align: center;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
        }
        span {
          display: grid;
          place-items: center;
          width: 58px;
          height: 58px;
          margin: 0 auto 14px;
          border-radius: 50%;
          background: #c7181b;
          color: #fff;
          font-size: 32px;
          font-weight: 900;
        }
        h2 { margin: 0 0 8px; font-size: 24px; }
        p { margin: 0 0 20px; color: #5f5652; line-height: 1.5; }
        button {
          width: 100%;
          min-height: 48px;
          border: 0;
          border-radius: 14px;
          background: #c7181b;
          color: #fff;
          font-weight: 900;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}
