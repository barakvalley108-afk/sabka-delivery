"use client";

import { useEffect } from "react";

const AUTH_TEXT = /^(login|sign\s*up|signup|login\s*\/\s*signup|profile)$/i;

function disableCustomerAuthUi() {
  if (window.location.pathname !== "/") return;

  document.querySelectorAll<HTMLElement>(".login-modal").forEach((modal) => {
    const overlay = modal.closest<HTMLElement>(".overlay");
    overlay?.remove();
  });

  document.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>("button, a").forEach((element) => {
    const text = (element.textContent || "").replace(/\s+/g, " ").trim();
    const label = (element.getAttribute("aria-label") || "").trim();

    if (AUTH_TEXT.test(text) || /login|sign\s*up|signup/i.test(label)) {
      element.dataset.customerAuthHidden = "true";
      element.style.setProperty("display", "none", "important");
    }
  });
}

export default function CustomerGuestMode() {
  useEffect(() => {
    if (window.location.pathname !== "/") return;

    document.documentElement.classList.add("customer-guest-mode");
    disableCustomerAuthUi();

    const observer = new MutationObserver(() => disableCustomerAuthUi());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("customer-guest-mode");
    };
  }, []);

  return null;
}
