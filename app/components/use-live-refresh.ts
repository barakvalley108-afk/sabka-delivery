"use client";

import { useEffect, useRef } from "react";

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
