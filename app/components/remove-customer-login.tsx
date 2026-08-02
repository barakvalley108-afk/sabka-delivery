"use client";

import { useEffect } from "react";

const AUTH_TEXT = /\b(login|log in|sign up|signup|otp|pin|forgot pin|customer pin)\b/i;

function removeCustomerAuthUi() {
  document.querySelectorAll<HTMLElement>(".login-modal, .customer-access-shell").forEach((node) => {
    const overlay = node.closest<HTMLElement>(".overlay");
    (overlay || node).remove();
  });

  document.querySelectorAll<HTMLElement>("button, a").forEach((element) => {
    const text = `${element.textContent || ""} ${element.getAttribute("aria-label") || ""}`.trim();
    if (!AUTH_TEXT.test(text)) return;
    if (element.closest("/panel-login, .panel-login")) return;
    element.style.display = "none";
    element.setAttribute("aria-hidden", "true");
    element.tabIndex = -1;
  });
}

export default function RemoveCustomerLogin() {
  useEffect(() => {
    removeCustomerAuthUi();
    const observer = new MutationObserver(removeCustomerAuthUi);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <style jsx global>{`
      .login-modal,
      .customer-access-shell,
      .overlay:has(.login-modal),
      .overlay:has(.customer-access-shell) {
        display: none !important;
        pointer-events: none !important;
      }
    `}</style>
  );
}
