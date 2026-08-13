"use client";

import { useEffect } from "react";

export default function HeroBannerRuntime() {
  useEffect(() => {
    let timer = 0;
    let active = true;

    const load = async () => {
      try {
        const response = await fetch("/api/banners", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!active || !Array.isArray(data?.banners)) return;

        const banners = data.banners
          .filter(
            (value: unknown): value is string =>
              typeof value === "string" && value.trim().length > 0,
          )
          .slice(0, 10);
        if (!banners.length) return;

        const hero = document.querySelector<HTMLElement>(".hero.food .hero-art");
        if (!hero) return;

        const oldBadge = hero.querySelector<HTMLElement>(".lala-badge");
        const viewport = document.createElement("div");
        viewport.className = "hero-banner-viewport";

        const track = document.createElement("div");
        track.className = "hero-banner-track";
        track.style.width = `${banners.length * 100}%`;

        banners.forEach((src, index) => {
          const slide = document.createElement("div");
          slide.className = "hero-banner-slide";
          slide.style.width = `${100 / banners.length}%`;
          slide.setAttribute("aria-hidden", index === 0 ? "false" : "true");

          const image = document.createElement("img");
          image.src = src;
          image.alt = `Sabka Delivery banner ${index + 1}`;
          image.loading = index === 0 ? "eager" : "lazy";
          image.decoding = "async";
          slide.appendChild(image);
          track.appendChild(slide);
        });

        viewport.appendChild(track);
        hero.innerHTML = "";
        hero.appendChild(viewport);
        if (oldBadge) hero.appendChild(oldBadge);
        hero.classList.add("hero-banner-carousel-mounted");

        const dots = document.createElement("div");
        dots.className = "hero-banner-dots";
        dots.setAttribute("role", "tablist");
        dots.setAttribute("aria-label", "Banner navigation");
        const dotButtons: HTMLButtonElement[] = [];

        let index = 0;

        const goTo = (next: number, restart = false) => {
          index = (next + banners.length) % banners.length;
          track.style.transform = `translate3d(-${index * (100 / banners.length)}%, 0, 0)`;
          dotButtons.forEach((dot, dotIndex) => {
            dot.classList.toggle("active", dotIndex === index);
            dot.setAttribute("aria-selected", dotIndex === index ? "true" : "false");
          });
          track.querySelectorAll<HTMLElement>(".hero-banner-slide").forEach((slide, slideIndex) => {
            slide.setAttribute("aria-hidden", slideIndex === index ? "false" : "true");
          });
          if (restart) start();
        };

        const start = () => {
          window.clearInterval(timer);
          timer = window.setInterval(() => goTo(index + 1), 4500);
        };

        banners.forEach((_, dotIndex) => {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.setAttribute("role", "tab");
          dot.setAttribute("aria-label", `Show banner ${dotIndex + 1}`);
          dot.setAttribute("aria-selected", dotIndex === 0 ? "true" : "false");
          dot.className = dotIndex === 0 ? "active" : "";
          dot.addEventListener("click", () => goTo(dotIndex, true));
          dots.appendChild(dot);
          dotButtons.push(dot);
        });
        hero.appendChild(dots);

        hero.addEventListener("mouseenter", () => window.clearInterval(timer));
        hero.addEventListener("mouseleave", start);
        hero.addEventListener("focusin", () => window.clearInterval(timer));
        hero.addEventListener("focusout", start);

        goTo(0);
        start();
      } catch {
        // Keep the original hero if the banner API is unavailable.
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
