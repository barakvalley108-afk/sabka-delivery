"use client";

import { useEffect } from "react";

const LOCAL_CATALOG_KEYS = [
  "sabka-delivery-market-catalog-v1",
  "sabka-delivery-market-catalog-v2",
];

export default function PwaRegister() {
  useEffect(() => {
    // Do not hydrate the customer homepage from an old local catalog.
    // Low-network fallback is handled by the versioned service-worker API cache.
    for (const key of LOCAL_CATALOG_KEYS) {
      window.localStorage.removeItem(key);
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
        .then(async (registration) => {
          await registration.update();
          registration.waiting?.postMessage({ type: "SKIP_WAITING" });
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
