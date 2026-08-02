"use client";

import { useEffect, useLayoutEffect } from "react";

const LOCAL_CATALOG_KEYS = [
  "sabka-delivery-market-catalog-v1",
  "sabka-delivery-market-catalog-v2",
  "sabka-delivery-market-catalog-v3",
];

export default function PwaRegister() {
  useLayoutEffect(() => {
    // Run before page useEffect so stale catalog can never paint first.
    for (const key of LOCAL_CATALOG_KEYS) {
      window.localStorage.removeItem(key);
    }

    if ("caches" in window) {
      void caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("sabka-delivery-data-") &&
                key !== "sabka-delivery-data-v3",
            )
            .map((key) => caches.delete(key)),
        ),
      );
    }
  }, []);

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
        void caches.keys().then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith("sabka-delivery-"))
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
          // Website remains usable if service-worker setup fails.
        });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
