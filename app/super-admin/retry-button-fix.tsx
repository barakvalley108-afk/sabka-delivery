"use client";

import { useEffect } from "react";

export default function RetryButtonFix() {
  useEffect(() => {
    function handleRetry(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest("button");
      if (!button) return;

      const text = button.textContent?.trim() || "";
      if (!text.includes("Retry")) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      if (button.dataset.refreshing === "true") return;
      button.dataset.refreshing = "true";
      button.disabled = true;
      button.textContent = "↻ Refreshing…";

      window.setTimeout(() => {
        window.location.reload();
      }, 80);
    }

    document.addEventListener("click", handleRetry, true);
    return () => document.removeEventListener("click", handleRetry, true);
  }, []);

  return null;
}
