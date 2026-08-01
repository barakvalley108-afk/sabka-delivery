"use client";

import { useEffect, useRef } from "react";

const CATALOG_CACHE_KEY = "sabka-delivery-market-catalog-v1";
const READY_CLASS = "catalog-fresh-ready";
const FETCH_PATCH_KEY = "__sabkaCatalogFetchPatched";

function markCatalogReady() {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      document.documentElement.classList.add(READY_CLASS);
    });
  });
}

if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem(CATALOG_CACHE_KEY);
  } catch {
    // Restricted/private browser storage should not block the app.
  }

  const patchedWindow = window as typeof window & {
    [FETCH_PATCH_KEY]?: boolean;
  };

  if (!patchedWindow[FETCH_PATCH_KEY]) {
    patchedWindow[FETCH_PATCH_KEY] = true;
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);

      try {
        const requestInput = args[0];
        const requestUrl =
          typeof requestInput === "string"
            ? requestInput
            : requestInput instanceof URL
              ? requestInput.href
              : requestInput.url;
        const pathname = new URL(requestUrl, window.location.href).pathname;

        if (pathname === "/api/market" && response.ok) {
          void response
            .clone()
            .json()
            .then((data: { stores?: unknown[]; items?: unknown[]; variants?: unknown[] }) => {
              if (
                Array.isArray(data.stores) &&
                Array.isArray(data.items) &&
                Array.isArray(data.variants)
              ) {
                markCatalogReady();
              }
            })
            .catch(() => undefined);
        }
      } catch {
        // Normal fetch behavior must never be interrupted.
      }

      return response;
    };

    // Safety fallback: never leave the website permanently hidden on a network failure.
    window.setTimeout(() => {
      document.documentElement.classList.add(READY_CLASS);
    }, 15000);
  }
}

export function useLiveRefresh(
  refresh: () => Promise<void>,
  intervalMs = 5000,
  options: { runWhenHidden?: boolean } = {},
) {
  const latest = useRef(refresh);
  const running = useRef(false);
  const effectiveInterval = intervalMs;
  const runWhenHidden = !!options.runWhenHidden;

  useEffect(() => {
    latest.current = refresh;
  }, [refresh]);

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      if (!mounted || running.current || (!runWhenHidden && document.hidden)) return;
      running.current = true;
      try {
        await latest.current();
      } finally {
        running.current = false;
      }
    };
    const wake = () => {
      if (runWhenHidden || !document.hidden) void tick();
    };
    void tick();
    const timer = window.setInterval(tick, effectiveInterval);
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [effectiveInterval, runWhenHidden]);
}
