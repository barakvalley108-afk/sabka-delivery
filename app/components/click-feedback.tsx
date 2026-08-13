"use client";

import { useEffect } from "react";

export default function ClickFeedback() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const clickable = target?.closest<HTMLElement>("button, a, [role='button'], input[type='submit'], input[type='button']");
      if (!clickable) return;
      if (clickable.matches(":disabled, [aria-disabled='true']")) return;
      if (clickable.closest(".hero-banner-dots")) return;

      const rect = clickable.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "premium-click-ripple";
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      clickable.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 520);
    };

    document.addEventListener("click", onClick, { passive: true });
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
