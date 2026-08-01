"use client";

import { useEffect } from "react";

const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toUpperCase();
const isAddButton = (button: HTMLButtonElement | null) => {
  const label = normalize(button?.textContent || "");
  return !!button && !button.disabled && (label === "ADD" || label === "ADD TO CART");
};

const findVisibleCartTarget = () => {
  const mobileButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".customer-mobile-nav button"),
  );
  const mobileCart = mobileButtons.find((button) =>
    button.textContent?.toLowerCase().includes("cart"),
  );
  if (mobileCart && getComputedStyle(mobileCart).display !== "none") return mobileCart;
  return (
    document.querySelector<HTMLElement>(".header-cart") ||
    document.querySelector<HTMLElement>('[aria-label^="Cart mein"]')
  );
};

const cartCountFromTarget = (target: Element | null) => {
  const text = target?.textContent || "";
  const match = text.match(/\((\d+)\)/);
  return match ? Number(match[1]) : 0;
};

const bounceCart = (target: HTMLElement) => {
  target.animate(
    [
      { transform: "scale(1)", offset: 0 },
      { transform: "scale(1.3)", offset: 0.28 },
      { transform: "scale(.9)", offset: 0.56 },
      { transform: "scale(1.12)", offset: 0.78 },
      { transform: "scale(1)", offset: 1 },
    ],
    { duration: 560, easing: "cubic-bezier(.2,.9,.3,1)" },
  );
};

const createFlyingLight = (
  sourceRect: DOMRect,
  targetRect: DOMRect,
  imageUrl?: string,
) => {
  const startX = sourceRect.left + sourceRect.width / 2;
  const startY = sourceRect.top + sourceRect.height / 2;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const lift = Math.min(180, Math.max(90, Math.abs(deltaX) * 0.22));
  const light = document.createElement("span");
  light.setAttribute("aria-hidden", "true");
  Object.assign(light.style, {
    position: "fixed",
    left: `${startX}px`,
    top: `${startY}px`,
    width: "44px",
    height: "44px",
    borderRadius: "999px",
    pointerEvents: "none",
    zIndex: "2147483647",
    opacity: "0",
    background: imageUrl
      ? `url("${imageUrl}") center/cover no-repeat`
      : "radial-gradient(circle,#fff 0 12%,#ffe04c 40%,#ff7000 72%,transparent 100%)",
    border: imageUrl ? "3px solid #fff" : "0",
    boxShadow: "0 0 14px #fff,0 0 34px #ffd84a,0 0 70px #ff7a00",
    willChange: "transform,opacity",
  });
  document.body.appendChild(light);
  const animation = light.animate(
    [
      { transform: "translate(-50%,-50%) scale(.25)", opacity: 0 },
      { transform: "translate(-50%,-50%) scale(1.2)", opacity: 1, offset: 0.14 },
      {
        transform: `translate(calc(-50% + ${deltaX * 0.5}px),calc(-50% + ${deltaY * 0.35 - lift}px)) scale(1)`,
        opacity: 1,
        offset: 0.58,
      },
      {
        transform: `translate(calc(-50% + ${deltaX}px),calc(-50% + ${deltaY}px)) scale(.08)`,
        opacity: 0,
      },
    ],
    { duration: 1050, easing: "cubic-bezier(.18,.72,.2,1)", fill: "forwards" },
  );
  animation.finished.catch(() => undefined).finally(() => light.remove());
};

function openDirectCheckout() {
  const cartTarget = findVisibleCartTarget();
  cartTarget?.click();
  window.setTimeout(() => {
    const checkoutButton = document.querySelector<HTMLButtonElement>(
      ".cart-drawer .checkout-button:not(:disabled)",
    );
    checkoutButton?.click();
  }, 320);
}

function enhanceProductButtons() {
  document.querySelectorAll<HTMLElement>(".product-card .price-row").forEach((row) => {
    const buttons = Array.from(row.querySelectorAll<HTMLButtonElement>("button"));
    const addButton = buttons.find((button) => isAddButton(button));
    if (!addButton || addButton.dataset.dualActionReady === "1") return;

    addButton.dataset.dualActionReady = "1";
    addButton.textContent = "Add to Cart";
    addButton.classList.add("add-to-cart-button");
    row.classList.add("two-product-actions");

    const existingBuyNow = row.querySelector<HTMLButtonElement>(".buy-now-button");
    if (existingBuyNow) return;

    const buyNow = document.createElement("button");
    buyNow.type = "button";
    buyNow.className = "buy-now-button";
    buyNow.textContent = "Buy Now";
    buyNow.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (addButton.disabled) return;
      addButton.click();
      window.setTimeout(openDirectCheckout, 160);
    });
    row.appendChild(buyNow);
  });
}

export default function CartFlightAnimation() {
  useEffect(() => {
    enhanceProductButtons();
    const observer = new MutationObserver(enhanceProductButtons);
    observer.observe(document.body, { subtree: true, childList: true });
    const reliabilityTimer = window.setInterval(enhanceProductButtons, 500);

    let pending:
      | { sourceRect: DOMRect; oldCount: number; imageUrl?: string }
      | undefined;

    const onPointerDown = (event: PointerEvent) => {
      const button = (event.target as HTMLElement | null)?.closest(
        "button",
      ) as HTMLButtonElement | null;
      if (!isAddButton(button)) {
        pending = undefined;
        return;
      }
      const card = button.closest(".product-card");
      const productVisual = card?.querySelector<HTMLElement>(".product-visual");
      const backgroundImage = productVisual?.style.backgroundImage || "";
      const imageMatch = backgroundImage.match(/url\(["']?(.*?)["']?\)/);
      pending = {
        sourceRect: button.getBoundingClientRect(),
        oldCount: cartCountFromTarget(findVisibleCartTarget()),
        imageUrl: imageMatch?.[1],
      };
    };

    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest(
        "button",
      ) as HTMLButtonElement | null;
      if (!pending || !isAddButton(button)) return;
      const captured = pending;
      pending = undefined;
      window.setTimeout(() => {
        const target = findVisibleCartTarget();
        if (!target) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          bounceCart(target);
          return;
        }
        createFlyingLight(
          captured.sourceRect,
          target.getBoundingClientRect(),
          captured.imageUrl,
        );
        window.setTimeout(() => bounceCart(target), 900);
      }, 70);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick);

    const style = document.createElement("style");
    style.id = "product-dual-actions-style";
    style.textContent = `
      .price-row.two-product-actions{display:grid!important;grid-template-columns:1fr 1fr;gap:8px;align-items:center}
      .price-row.two-product-actions>div{grid-column:1/-1}
      .price-row.two-product-actions>.add-to-cart-button,
      .price-row.two-product-actions>.buy-now-button{display:block!important;width:100%!important;min-height:42px!important;margin:0!important;border-radius:10px!important;font-size:11px!important;font-weight:950!important;padding:9px 7px!important;visibility:visible!important;opacity:1!important}
      .price-row.two-product-actions>.add-to-cart-button{background:#fff!important;color:#d8a637!important;border:1.5px solid #d8a637!important}
      .price-row.two-product-actions>.buy-now-button{background:#d8a637!important;color:#17120a!important;border:1.5px solid #d8a637!important}
      @media(max-width:420px){.price-row.two-product-actions{gap:6px}.price-row.two-product-actions>.add-to-cart-button,.price-row.two-product-actions>.buy-now-button{font-size:9px!important;padding:8px 4px!important}}
    `;
    document.head.appendChild(style);

    return () => {
      observer.disconnect();
      window.clearInterval(reliabilityTimer);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick);
      style.remove();
    };
  }, []);

  return null;
}
