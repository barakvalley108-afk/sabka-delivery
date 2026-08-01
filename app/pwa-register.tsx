"use client";

import { useEffect } from "react";

const LEGACY_CATALOG_CACHE_KEY = "sabka-delivery-market-catalog-v1";

export default function PwaRegister() {
  /*
   * This runs during render, before Home's useEffect reads localStorage.
   * Parent passive effects run after child effects, so clearing only inside
   * useEffect was too late and allowed the old catalog/UI to flash first.
   */
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(LEGACY_CATALOG_CACHE_KEY);
    } catch {
      // Storage can be unavailable in private/restricted browser modes.
    }
  }

  useEffect(() => {
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
        .then(async (registration) => {
          await registration.update();

          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        })
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
