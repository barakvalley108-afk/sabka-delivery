"use client";

import { useEffect } from "react";

export default function HeroBannerRuntime() {
  useEffect(() => {
    let timer = 0;
    let active = true;
    let banners: string[] = [];
    let index = 0;

    const apply = () => {
      const hero = document.querySelector<HTMLElement>(".hero.food .hero-art");
      if (!hero || !banners.length) return;
      hero.style.backgroundImage = `url(${JSON.stringify(banners[index]).slice(1, -1)})`;
      index = (index + 1) % banners.length;
    };

    const load = async () => {
      try {
        const response = await fetch("/api/banners", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!active || !Array.isArray(data?.banners)) return;
        banners = data.banners.filter((value: unknown): value is string => typeof value === "string" && value.length > 0).slice(0, 10);
        if (!banners.length) return;
        apply();
        timer = window.setInterval(apply, 6000);
      } catch {
        // Existing customer hero remains the fallback.
      }
    };

    void load();
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
