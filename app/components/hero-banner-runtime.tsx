"use client";

import { useEffect } from "react";

export default function HeroBannerRuntime() {
  useEffect(() => {
    let active = true;
    let timer = 0;
    let mounted = false;
    let observer: MutationObserver | null = null;
    let retryTimer = 0;

    const loadBanners = async () => {
      try {
        const response = await fetch("/api/banners", { cache: "no-store" });
        if (!response.ok) throw new Error("Banner API failed");
        const data = await response.json();
        const banners = Array.isArray(data?.banners)
          ? data.banners
              .filter(
                (value: unknown): value is string =>
                  typeof value === "string" && value.trim().length > 0,
              )
              .slice(0, 10)
          : [];
        if (!active || !banners.length) return;

        const mount = () => {
          if (!active || mounted) return true;
          const hero = document.querySelector<HTMLElement>(
            ".hero.food .hero-art",
          );
          if (!hero) return false;

          mounted = true;
          hero.classList.add("hero-banner-carousel-mounted");
          const oldBadge = hero.querySelector<HTMLElement>(".lala-badge");

          const viewport = document.createElement("div");
          viewport.className = "hero-banner-viewport";
          viewport.setAttribute("aria-label", "Sabka Delivery banners");

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
          hero.replaceChildren(viewport);
          if (oldBadge) hero.appendChild(oldBadge);

          const dots = document.createElement("div");
          dots.className = "hero-banner-dots";
          dots.setAttribute("role", "tablist");
          dots.setAttribute("aria-label", "Banner navigation");
          const dotButtons: HTMLButtonElement[] = [];
          let index = 0;

          const update = () => {
            track.style.transform = `translate3d(-${index * (100 / banners.length)}%,0,0)`;
            dotButtons.forEach((dot, dotIndex) => {
              const selected = dotIndex === index;
              dot.classList.toggle("active", selected);
              dot.setAttribute("aria-selected", selected ? "true" : "false");
            });
            track
              .querySelectorAll<HTMLElement>(".hero-banner-slide")
              .forEach((slide, slideIndex) => {
                slide.setAttribute("aria-hidden", slideIndex === index ? "false" : "true");
              });
          };

          const next = () => {
            index = (index + 1) % banners.length;
            update();
          };

          const restart = () => {
            window.clearInterval(timer);
            timer = window.setInterval(next, 4000);
          };

          banners.forEach((_, dotIndex) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.setAttribute("role", "tab");
            dot.setAttribute("aria-label", `Show banner ${dotIndex + 1}`);
            dot.addEventListener("click", () => {
              index = dotIndex;
              update();
              restart();
            });
            dots.appendChild(dot);
            dotButtons.push(dot);
          });

          hero.appendChild(dots);
          hero.addEventListener("mouseenter", () => window.clearInterval(timer));
          hero.addEventListener("mouseleave", restart);
          hero.addEventListener("touchstart", () => window.clearInterval(timer), { passive: true });
          hero.addEventListener("touchend", restart, { passive: true });

          update();
          restart();
          return true;
        };

        // The runtime lives in the root layout, so its effect can run before
        // the customer homepage hero has committed. Watch for the hero instead
        // of giving up on the first query.
        if (!mount()) {
          observer = new MutationObserver(() => {
            if (mount()) {
              observer?.disconnect();
              observer = null;
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
          retryTimer = window.setTimeout(() => {
            if (mount()) {
              observer?.disconnect();
              observer = null;
            }
          }, 3000);
        }
      } catch {
        // Existing homepage hero remains the fallback if banners cannot load.
      }
    };

    void loadBanners();

    return () => {
      active = false;
      mounted = false;
      window.clearInterval(timer);
      window.clearTimeout(retryTimer);
      observer?.disconnect();
    };
  }, []);

  return null;
}
