"use client";

import { useEffect } from "react";

const BUY_NOW_CLASS = "buy-now-button";
const ANIMATION_BOUND = "cartAnimationBound";

function findCartButton() {
  return document.querySelector<HTMLButtonElement>(
    '.mobile-nav button[aria-label^="Cart mein"], .header-cart, button[aria-label^="Cart mein"]',
  );
}

function restartClass(element: HTMLElement, className: string) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => element.classList.remove(className), 720);
}

function animateItemToCart(card: HTMLElement) {
  const cartButton = findCartButton();
  const visual = card.querySelector<HTMLElement>(".product-visual");
  if (!cartButton || !visual) return;

  const source = visual.getBoundingClientRect();
  const target = cartButton.getBoundingClientRect();
  if (!source.width || !source.height || !target.width || !target.height) return;

  const flyer = document.createElement("div");
  flyer.className = "cart-flying-item";
  const backgroundImage = window.getComputedStyle(visual).backgroundImage;
  flyer.style.backgroundImage =
    backgroundImage && backgroundImage !== "none"
      ? backgroundImage
      : "url(/images/sabka-delivery-logo.png)";
  flyer.style.left = `${source.left + source.width / 2 - 28}px`;
  flyer.style.top = `${source.top + source.height / 2 - 28}px`;
  flyer.style.setProperty(
    "--cart-fly-x",
    `${target.left + target.width / 2 - (source.left + source.width / 2)}px`,
  );
  flyer.style.setProperty(
    "--cart-fly-y",
    `${target.top + target.height / 2 - (source.top + source.height / 2)}px`,
  );
  document.body.appendChild(flyer);

  restartClass(card, "product-added-pulse");
  window.setTimeout(() => restartClass(cartButton, "cart-added-blink"), 430);
  window.setTimeout(() => flyer.remove(), 760);
}

function bindAddAnimation(card: HTMLElement, addButton: HTMLButtonElement) {
  if (addButton.dataset[ANIMATION_BOUND] === "1") return;
  addButton.dataset[ANIMATION_BOUND] = "1";
  addButton.addEventListener("click", () => animateItemToCart(card));
}

function enhanceProductCards() {
  document.querySelectorAll<HTMLElement>(".product-card").forEach((card) => {
    const addButton = card.querySelector<HTMLButtonElement>(
      ".price-row > button:not(:disabled), .product-action-buttons > button:not(.buy-now-button):not(:disabled)",
    );
    if (!addButton) return;

    bindAddAnimation(card, addButton);

    if (card.querySelector(`.${BUY_NOW_CLASS}`)) return;

    const actions = document.createElement("div");
    actions.className = "product-action-buttons";

    const buyNow = document.createElement("button");
    buyNow.type = "button";
    buyNow.className = BUY_NOW_CLASS;
    buyNow.textContent = "BUY NOW";
    buyNow.setAttribute("aria-label", "Buy now");

    buyNow.addEventListener("click", () => {
      addButton.click();

      window.setTimeout(() => {
        findCartButton()?.click();
      }, 620);
    });

    const parent = addButton.parentElement;
    if (!parent) return;

    parent.insertBefore(actions, addButton);
    actions.appendChild(buyNow);
    actions.appendChild(addButton);
  });
}

export default function CustomerUiFixes() {
  useEffect(() => {
    enhanceProductCards();

    const observer = new MutationObserver(() => enhanceProductCards());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
