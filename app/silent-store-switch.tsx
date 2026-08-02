"use client";

import { useEffect } from "react";

const STORE_SWITCH_MESSAGE =
  "Dusre store ka cart start karne par current cart clear ho jayega. Continue?";

export default function SilentStoreSwitch() {
  useEffect(() => {
    const originalConfirm = window.confirm.bind(window);

    window.confirm = (message?: string) => {
      if (String(message || "").trim() === STORE_SWITCH_MESSAGE) {
        return true;
      }

      return originalConfirm(message);
    };

    return () => {
      window.confirm = originalConfirm;
    };
  }, []);

  return null;
}
