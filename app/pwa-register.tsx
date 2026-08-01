"use client";

import { useEffect } from "react";

const LEGACY_CATALOG_CACHE_KEY = "sabka-delivery-market-catalog-v1";

export default function PwaRegister() {
  useEffect(() => {
    // Remove the old partial catalog before the Home page reads localStorage.
    // Fresh /api/market data then renders all shops and items together.
    try {
      window.localStorage.removeItem(LEGACY_CATALOG_CACHE_KEY);
    } catch {
      // Storage can be unavailable in private/restricted browser modes.
    }

    if (!("serviceWorker" in navigator)) return;

    const localHostnames = new Set(["localhost", "127.0.0.1", "::1"]);
    if (localHostnames.has(window.location.hostname)) {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister())),
        );
      if ("caches" in window) {
        void caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => key.startsWith("sabka-delivery-app-"))
                .map((key) => caches.delete(key)),
            ),
          );
      }
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch(() => {
          // The web experience must remain usable if service-worker setup fails.
        });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
