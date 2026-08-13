"use client";

import { useEffect } from "react";

const banners = [
  "/images/hero-food-collage.png",
  "/images/hero-food.png",
  "/images/biryani-card.png",
  "/images/curry-card.png",
  "/images/grocery-staples.png",
  "/images/grocery-vegetables.png",
  "/images/grocery-daily-needs.png",
  "/images/electronics-hero.webp",
  "/images/sabka-delivery-logo.png",
  "/images/hero-food-collage.png",
];

export default function HeroBannerController() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hero = document.querySelector<HTMLElement>(".hero.food .hero-art");
    if (!hero || hero.dataset.carouselReady === "1") return;

    hero.dataset.carouselReady = "1";
    hero.classList.add("hero-banner-carousel-mounted");
    hero.innerHTML = "";

    const viewport = document.createElement("div");
    viewport.className = "hero-banner-viewport";

    const track = document.createElement("div");
    track.className = "hero-banner-track";

    banners.forEach((src, index) => {
      const slide = document.createElement("div");
      slide.className = "hero-banner-slide";
      slide.setAttribute("aria-hidden", index === 0 ? "false" : "true");
      const img = document.createElement("img");
      img.src = src;
      img.alt = `Sabka Delivery banner ${index + 1}`;
      img.loading = index === 0 ? "eager" : "lazy";
      slide.appendChild(img);
      track.appendChild(slide);
    });

    viewport.appendChild(track);
    hero.appendChild(viewport);

    const dots = document.createElement("div");
    dots.className = "hero-banner-dots";
    dots.setAttribute("aria-label", "Banner navigation");
    const dotButtons: HTMLButtonElement[] = [];

    banners.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = index === 0 ? "active" : "";
      dot.setAttribute("aria-label", `Show banner ${index + 1}`);
      dot.addEventListener("click", () => goTo(index, true));
      dots.appendChild(dot);
      dotButtons.push(dot);
    });
    hero.appendChild(dots);

    let current = 0;
    let timer = 0;

    function goTo(index: number, manual = false) {
      current = (index + banners.length) % banners.length;
      track.style.transform = `translate3d(-${current * 10}%, 0, 0)`;
      dotButtons.forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === current));
      track.querySelectorAll<HTMLElement>(".hero-banner-slide").forEach((slide, slideIndex) => {
        slide.setAttribute("aria-hidden", slideIndex === current ? "false" : "true");
      });
      if (manual) restart();
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(() => goTo(current + 1), 4200);
    }

    hero.addEventListener("mouseenter", () => window.clearInterval(timer));
    hero.addEventListener("mouseleave", restart);
    hero.addEventListener("focusin", () => window.clearInterval(timer));
    hero.addEventListener("focusout", restart);
    restart();

    return () => {
      window.clearInterval(timer);
      hero.replaceChildren();
      hero.removeAttribute("data-carousel-ready");
      hero.classList.remove("hero-banner-carousel-mounted");
    };
  }, []);

  return null;
}
