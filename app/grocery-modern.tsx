"use client";

import { useEffect } from "react";

function syncGroceryMode() {
  const app = document.querySelector<HTMLElement>(".apna-app");
  if (!app) return;

  const activeNav = Array.from(
    document.querySelectorAll<HTMLElement>(".mobile-nav button.active, nav button.active"),
  ).find((button) => button.textContent?.trim().toLowerCase().includes("grocery"));

  const groceryHero = Array.from(
    document.querySelectorAll<HTMLElement>(".hero-copy small, .section-title h2"),
  ).some((node) => node.textContent?.toLowerCase().includes("grocery"));

  app.classList.toggle("grocery-modern", Boolean(activeNav || groceryHero));
}

export default function GroceryModern() {
  useEffect(() => {
    syncGroceryMode();

    const onClick = () => window.setTimeout(syncGroceryMode, 0);
    document.addEventListener("click", onClick, true);

    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(() => {
        queued = false;
        syncGroceryMode();
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      document.removeEventListener("click", onClick, true);
      observer.disconnect();
    };
  }, []);

  return null;
}
