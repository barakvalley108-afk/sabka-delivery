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
        const clean = (values: unknown) =>
          Array.isArray(values)
            ? values
                .filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
                .slice(0, 5)
            : [];
        const foodBanners = clean(data?.foodBanners);
        const groceryBanners = clean(data?.groceryBanners);
        if (!active || (!foodBanners.length && !groceryBanners.length)) return;

        const mount = () => {
          if (!active || mounted) return true;
          const hero = document.querySelector<HTMLElement>(".hero.food .hero-art, .hero.grocery .hero-art");
          if (!hero) return false;

          const isGrocery = hero.closest(".hero.grocery") !== null;
          const banners = (isGrocery ? groceryBanners : foodBanners).slice(0, 5);
          if (!banners.length) return false;
          mounted = true;
          hero.classList.add("hero-banner-carousel-mounted");

          const oldBadge = hero.querySelector<HTMLElement>(".lala-badge");
          const viewport = document.createElement("div");
          viewport.className = "hero-banner-viewport";
          viewport.setAttribute("aria-label", `${isGrocery ? "Grocery" : "Food"} banners`);

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
            image.alt = `Sabka Delivery ${isGrocery ? "grocery" : "food"} banner ${index + 1}`;
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
          dots.setAttribute("aria-label", `${isGrocery ? "Grocery" : "Food"} banner navigation`);
          const dotButtons: HTMLButtonElement[] = [];
          let index = 0;

          const update = () => {
            const offset = index * (100 / banners.length);
            track.style.transform = `translate3d(-${offset}%,0,0)`;
            dotButtons.forEach((dot, dotIndex) => {
              const selected = dotIndex === index;
              dot.classList.toggle("active", selected);
              dot.setAttribute("aria-selected", selected ? "true" : "false");
            });
            track.querySelectorAll<HTMLElement>(".hero-banner-slide").forEach((slide, slideIndex) => {
              slide.setAttribute("aria-hidden", slideIndex === index ? "false" : "true");
            });
          };

          const next = () => {
            index = (index + 1) % banners.length;
            update();
          };

          const restart = () => {
            window.clearInterval(timer);
            timer = window.setInterval(next, 2500);
          };

          banners.forEach((_, dotIndex) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.setAttribute("role", "tab");
            dot.setAttribute("aria-label", `Show ${isGrocery ? "grocery" : "food"} banner ${dotIndex + 1}`);
            dot.addEventListener("click", () => {
              index = dotIndex;
              update();
              restart();
            });
            dots.appendChild(dot);
            dotButtons.push(dot);
          });
          hero.appendChild(dots);

          let touchStartX = 0;
          let touchStartY = 0;
          let touchMoved = false;
          let wheelLock = false;
          const onTouchStart = (event: TouchEvent) => {
            const touch = event.touches[0];
            if (!touch) return;
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchMoved = false;
            window.clearInterval(timer);
          };
          const onTouchMove = (event: TouchEvent) => {
            const touch = event.touches[0];
            if (!touch) return;
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 12) touchMoved = true;
          };
          const onTouchEnd = (event: TouchEvent) => {
            if (touchMoved) {
              const touch = event.changedTouches[0];
              const dx = touch ? touch.clientX - touchStartX : 0;
              if (Math.abs(dx) > 35) {
                index = (dx < 0 ? index + 1 : index - 1 + banners.length) % banners.length;
                update();
              }
            }
            restart();
          };
          const onWheel = (event: WheelEvent) => {
            if (wheelLock || Math.abs(event.deltaX) < 20) return;
            wheelLock = true;
            index = (event.deltaX > 0 ? index + 1 : index - 1 + banners.length) % banners.length;
            update();
            restart();
            window.setTimeout(() => { wheelLock = false; }, 500);
          };

          hero.addEventListener("mouseenter", () => window.clearInterval(timer));
          hero.addEventListener("mouseleave", restart);
          hero.addEventListener("touchstart", onTouchStart, { passive: true });
          hero.addEventListener("touchmove", onTouchMove, { passive: true });
          hero.addEventListener("touchend", onTouchEnd, { passive: true });
          hero.addEventListener("wheel", onWheel, { passive: true });
          update();
          restart();
          return true;
        };

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
        // Keep original hero as fallback.
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
