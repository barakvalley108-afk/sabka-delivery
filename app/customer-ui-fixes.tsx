"use client";

import { useEffect } from "react";

const BUY_NOW_CLASS = "buy-now-button";

function enhanceProductCards() {
  document.querySelectorAll<HTMLElement>(".product-card").forEach((card) => {
    if (card.querySelector(`.${BUY_NOW_CLASS}`)) return;

    const addButton = card.querySelector<HTMLButtonElement>(
      ".price-row > button:not(:disabled)",
    );
    if (!addButton) return;

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
        const cartButton = document.querySelector<HTMLButtonElement>(
          '.mobile-nav button[aria-label^="Cart mein"], .header-cart',
        );
        cartButton?.click();
      }, 80);
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
