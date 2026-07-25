"use client";

import { useEffect } from "react";

export default function PwaRegister() {
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
