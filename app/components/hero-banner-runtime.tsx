"use client";

import { useEffect } from "react";

const FALLBACK_BANNERS = [
  "/images/hero-food-collage.png",
  "/images/hero-food.png",
  "/images/biryani-card.png",
  "/images/curry-card.png",
  "/images/grocery-daily-needs.png",
  "/images/grocery-vegetables.png",
  "/images/grocery-staples.png",
  "/images/electronics-hero.webp",
  "/images/sabka-delivery-logo.png",
  "/images/hero-food-collage.png",
];

export default function HeroBannerRuntime() {
  useEffect(() => {
    let timer = 0;
    let active = true;

    const mount = (banners: string[]) => {
      if (!active || banners.length < 2) return;
      const hero = document.querySelector<HTMLElement>(".hero.food .hero-art");
      if (!hero) return;

      const viewport = document.createElement("div");
      viewport.className = "hero-banner-viewport";
      const track = document.createElement("div");
      track.className = "hero-banner-track";
      track.style.width = `${banners.length * 100}%`;

      banners.forEach((src, i) => {
        const slide = document.createElement("div");
        slide.className = "hero-banner-slide";
        slide.style.width = `${100 / banners.length}%`;
        const image = document.createElement("img");
        image.src = src;
        image.alt = `Sabka Delivery banner ${i + 1}`;
        image.loading = i === 0 ? "eager" : "lazy";
        image.decoding = "async";
        slide.appendChild(image);
        track.appendChild(slide);
      });
      viewport.appendChild(track);

      const dots = document.createElement("div");
      dots.className = "hero-banner-dots";
      dots.setAttribute("role", "tablist");
      dots.setAttribute("aria-label", "Banner navigation");
      const dotButtons: HTMLButtonElement[] = [];

      hero.innerHTML = "";
      hero.appendChild(viewport);
      hero.appendChild(dots);
      hero.classList.add("hero-banner-carousel-mounted");

      let index = 0;
      let paused = false;

      const goTo = (next: number) => {
        index = (next + banners.length) % banners.length;
        track.style.setProperty(
          "transform",
          `translate3d(-${index * (100 / banners.length)}%,0,0)`,
          "important",
        );
        dotButtons.forEach((dot, i) => {
          dot.classList.toggle("active", i === index);
          dot.setAttribute("aria-selected", i === index ? "true" : "false");
        });
      };

      const start = () => {
        window.clearInterval(timer);
        if (!paused) timer = window.setInterval(() => goTo(index + 1), 4500);
      };
      const pause = () => {
        paused = true;
        window.clearInterval(timer);
      };
      const resume = () => {
        paused = false;
        start();
      };

      banners.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `Show banner ${i + 1}`);
        dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
        if (i === 0) dot.className = "active";
        dot.addEventListener("click", () => {
          goTo(i);
          start();
        });
        dots.appendChild(dot);
        dotButtons.push(dot);
      });

      let touchStartX = 0;
      hero.addEventListener("mouseenter", pause);
      hero.addEventListener("mouseleave", resume);
      hero.addEventListener("touchstart", e => {
        touchStartX = e.changedTouches[0]?.clientX || 0;
        pause();
      }, { passive: true });
      hero.addEventListener("touchend", e => {
        const delta = (e.changedTouches[0]?.clientX || 0) - touchStartX;
        if (Math.abs(delta) > 35) goTo(index + (delta < 0 ? 1 : -1));
        resume();
      }, { passive: true });

      goTo(0);
      start();
    };

    const load = async () => {
      let banners = FALLBACK_BANNERS;
      try {
        const response = await fetch("/api/banners", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          const configured = Array.isArray(data?.banners)
            ? data.banners.filter((v: unknown): v is string => typeof v === "string" && v.trim().length > 0).slice(0, 10)
            : [];
          if (configured.length >= 2) banners = configured;
        }
      } catch {
        // Built-in fallback keeps the carousel working even if the API is unavailable.
      }
      mount(banners);
    };

    void load();
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
