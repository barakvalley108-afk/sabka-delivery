"use client";

import { useEffect } from "react";

const RELEASE_VERSION = "2026-08-01-ui-refresh-v2";
const RELEASE_STORAGE_KEY = "sabka-delivery-release-version";
const CATALOG_CACHE_KEY = "sabka-delivery-market-catalog-v1";

export default function PwaRegister() {
  useEffect(() => {
    const clearPreviousReleaseCache = async () => {
      const previousRelease = window.localStorage.getItem(RELEASE_STORAGE_KEY);
      if (previousRelease === RELEASE_VERSION) return;

      window.localStorage.removeItem(CATALOG_CACHE_KEY);
      window.sessionStorage.removeItem(CATALOG_CACHE_KEY);

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => key.startsWith("sabka-delivery-app-"))
            .map((key) => caches.delete(key)),
        );
      }

      window.localStorage.setItem(RELEASE_STORAGE_KEY, RELEASE_VERSION);
    };

    void clearPreviousReleaseCache();

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
        .register(`/sw.js?v=${encodeURIComponent(RELEASE_VERSION)}`, {
          scope: "/",
          updateViaCache: "none",
        })
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
