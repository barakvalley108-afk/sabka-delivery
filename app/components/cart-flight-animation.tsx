"use client";

import { useEffect } from "react";

const cartCountFromTarget = (target: Element | null) => {
  const text = target?.textContent || "";
  const match = text.match(/\((\d+)\)/);
  return match ? Number(match[1]) : 0;
};

const findCartTarget = () =>
  document.querySelector<HTMLElement>('[aria-label^="Cart mein"]') ||
  document.querySelector<HTMLElement>(".header-cart");

const createFlyingLight = (
  sourceRect: DOMRect,
  targetRect: DOMRect,
  imageUrl?: string,
) => {
  const startX = sourceRect.left + sourceRect.width / 2;
  const startY = sourceRect.top + sourceRect.height / 2;
  const endX =
    targetRect.width > 0
      ? targetRect.left + targetRect.width / 2
      : Math.max(34, window.innerWidth * 0.1);
  const endY =
    targetRect.height > 0
      ? targetRect.top + targetRect.height / 2
      : window.innerHeight - 34;

  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const lift = Math.min(130, Math.max(62, Math.abs(deltaX) * 0.18));

  const light = document.createElement("span");
  light.setAttribute("aria-hidden", "true");

  Object.assign(light.style, {
    position: "fixed",
    left: `${startX}px`,
    top: `${startY}px`,
    width: "22px",
    height: "22px",
    borderRadius: "999px",
    pointerEvents: "none",
    zIndex: "2147483647",
    opacity: "0",
    background:
      "radial-gradient(circle at 38% 32%, #ffffff 0 18%, #fff49b 30%, #ffcc35 54%, #ff6b00 76%, rgba(255, 77, 0, 0) 100%)",
    boxShadow:
      "0 0 8px #ffffff, 0 0 18px #ffe45c, 0 0 34px #ff9f1c, 0 0 52px rgba(255, 70, 0, .8)",
    filter: "saturate(1.2)",
    willChange: "transform, opacity",
  });

  if (imageUrl) {
    light.style.backgroundImage = `url("${imageUrl}")`;
    light.style.backgroundPosition = "center";
    light.style.backgroundSize = "cover";
    light.style.border = "2px solid rgba(255,255,255,.92)";
  }

  const trail = document.createElement("span");
  Object.assign(trail.style, {
    position: "absolute",
    left: "-34px",
    top: "7px",
    width: "42px",
    height: "8px",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg, rgba(255,157,0,0), rgba(255,206,49,.48), rgba(255,255,255,.95))",
    filter: "blur(3px)",
    transformOrigin: "right center",
  });

  light.appendChild(trail);
  document.body.appendChild(light);

  const animation = light.animate(
    [
      {
        transform: "translate(-50%, -50%) scale(.35)",
        opacity: 0,
        offset: 0,
      },
      {
        transform: "translate(-50%, -50%) scale(1.15)",
        opacity: 1,
        offset: 0.12,
      },
      {
        transform: `translate(calc(-50% + ${deltaX * 0.38}px), calc(-50% + ${
          deltaY * 0.2 - lift
        }px)) scale(1)`,
        opacity: 1,
        offset: 0.48,
      },
      {
        transform: `translate(calc(-50% + ${deltaX * 0.76}px), calc(-50% + ${
          deltaY * 0.64 - lift * 0.48
        }px)) scale(.72)`,
        opacity: 0.95,
        offset: 0.78,
      },
      {
        transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(.12)`,
        opacity: 0,
        offset: 1,
      },
    ],
    {
      duration: 720,
      easing: "cubic-bezier(.2,.82,.25,1)",
      fill: "forwards",
    },
  );

  animation.finished
    .catch(() => undefined)
    .finally(() => light.remove());
};

const bounceCart = (target: HTMLElement) => {
  target.animate(
    [
      { transform: "scale(1)", offset: 0 },
      { transform: "scale(1.22)", offset: 0.34 },
      { transform: "scale(.94)", offset: 0.64 },
      { transform: "scale(1.06)", offset: 0.82 },
      { transform: "scale(1)", offset: 1 },
    ],
    {
      duration: 440,
      easing: "cubic-bezier(.2,.9,.3,1)",
    },
  );
};

export default function CartFlightAnimation() {
  useEffect(() => {
    let pending:
      | {
          sourceRect: DOMRect;
          oldCount: number;
          imageUrl?: string;
        }
      | undefined;

    const onPointerDown = (event: PointerEvent) => {
      const button = (event.target as HTMLElement | null)?.closest(
        "button",
      ) as HTMLButtonElement | null;

      if (
        !button ||
        button.disabled ||
        button.textContent?.trim().toUpperCase() !== "ADD"
      ) {
        pending = undefined;
        return;
      }

      const card = button.closest(".product-card");
      const productVisual = card?.querySelector<HTMLElement>(".product-visual");
      const backgroundImage = productVisual?.style.backgroundImage || "";
      const imageMatch = backgroundImage.match(/url\(["']?(.*?)["']?\)/);

      pending = {
        sourceRect: button.getBoundingClientRect(),
        oldCount: cartCountFromTarget(findCartTarget()),
        imageUrl: imageMatch?.[1],
      };
    };

    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest(
        "button",
      ) as HTMLButtonElement | null;

      if (
        !pending ||
        !button ||
        button.disabled ||
        button.textContent?.trim().toUpperCase() !== "ADD"
      ) {
        return;
      }

      const captured = pending;
      pending = undefined;

      window.setTimeout(() => {
        const target = findCartTarget();
        if (!target) return;

        const newCount = cartCountFromTarget(target);

        // Normal add mein count badhega. Store change ke case mein count same
        // reh sakta hai, isliye visible ADD click par animation allow hai.
        if (newCount < 0 || captured.oldCount < 0) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          bounceCart(target);
          return;
        }

        createFlyingLight(
          captured.sourceRect,
          target.getBoundingClientRect(),
          captured.imageUrl,
        );

        window.setTimeout(() => bounceCart(target), 610);
      }, 70);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
