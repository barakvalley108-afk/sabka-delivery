"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

export default function ForgotPinSupport() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname !== "/customer-access") return null;

  return (
    <>
      <button
        type="button"
        className="forgot-pin-trigger"
        onClick={() => setOpen(true)}
      >
        Forgot PIN?
      </button>

      {open && (
        <div className="forgot-pin-overlay" onClick={() => setOpen(false)}>
          <section className="forgot-pin-card" onClick={(event) => event.stopPropagation()}>
            <button className="forgot-pin-close" type="button" onClick={() => setOpen(false)}>
              ×
            </button>
            <span className="forgot-pin-icon">🔐</span>
            <h2>PIN Recovery</h2>
            <p>Apna registered mobile number support team ko batayein. Verification ke baad admin naya PIN set karega.</p>
            <a
              className="forgot-pin-whatsapp"
              href="https://wa.me/918011767897?text=Hello%20Sabka%20Delivery%2C%20main%20apna%20login%20PIN%20bhool%20gaya%2Fgayi%20hoon.%20Mera%20registered%20mobile%20number%3A%20"
              target="_blank"
              rel="noreferrer"
            >
              💬 WhatsApp 8011767897
            </a>
            <a className="forgot-pin-call" href="tel:7099850326">
              📞 Call 7099850326
            </a>
            <small>PIN kabhi bhi message me share mat karein.</small>
          </section>
        </div>
      )}

      <style jsx global>{`
        .forgot-pin-trigger {
          position: fixed;
          z-index: 10020;
          left: 50%;
          bottom: 22px;
          transform: translateX(-50%);
          border: 0;
          background: transparent;
          color: #b31519;
          font-size: 14px;
          font-weight: 900;
          text-decoration: underline;
          cursor: pointer;
        }
        .forgot-pin-overlay {
          position: fixed;
          z-index: 10030;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 18px;
          background: rgba(38, 20, 16, .58);
          backdrop-filter: blur(5px);
        }
        .forgot-pin-card {
          position: relative;
          width: min(100%, 390px);
          padding: 27px 22px 22px;
          border-radius: 24px;
          background: #fffdf9;
          box-shadow: 0 28px 80px rgba(45, 18, 12, .28);
          text-align: center;
          color: #2d1d19;
        }
        .forgot-pin-close {
          position: absolute;
          right: 13px;
          top: 12px;
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 50%;
          background: #f5ebe6;
          font-size: 23px;
          cursor: pointer;
        }
        .forgot-pin-icon { font-size: 40px; }
        .forgot-pin-card h2 { margin: 8px 0 7px; font-size: 24px; }
        .forgot-pin-card p { margin: 0 0 18px; color: #755b53; font-size: 13px; line-height: 1.5; }
        .forgot-pin-card a {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          margin-top: 10px;
          border-radius: 14px;
          color: white;
          text-decoration: none;
          font-weight: 900;
        }
        .forgot-pin-whatsapp { background: #159447; }
        .forgot-pin-call { background: #c7181b; }
        .forgot-pin-card small { display: block; margin-top: 15px; color: #8b7168; font-size: 11px; }
        @media (max-width: 520px) {
          .forgot-pin-trigger { bottom: 12px; }
        }
      `}</style>
    </>
  );
}
