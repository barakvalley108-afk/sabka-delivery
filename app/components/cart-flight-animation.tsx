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
      : Math.max(38, window.innerWidth * 0.1);

  const endY =
    targetRect.height > 0
      ? targetRect.top + targetRect.height / 2
      : window.innerHeight - 40;

  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const lift = Math.min(190, Math.max(100, Math.abs(deltaX) * 0.24));

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
    background:
      "radial-gradient(circle at 36% 30%, #ffffff 0 14%, #fff8b0 24%, #ffe04c 42%, #ff9d00 64%, #ff3d00 82%, rgba(255,61,0,0) 100%)",
    boxShadow:
      "0 0 12px #ffffff, 0 0 28px #fff36b, 0 0 52px #ffb000, 0 0 86px rgba(255,74,0,.95)",
    filter: "saturate(1.35) brightness(1.1)",
    willChange: "transform, opacity",
  });

  if (imageUrl) {
    light.style.backgroundImage = `url("${imageUrl}")`;
    light.style.backgroundPosition = "center";
    light.style.backgroundSize = "cover";
    light.style.border = "3px solid rgba(255,255,255,.96)";
    light.style.boxShadow =
      "0 0 12px #ffffff, 0 0 30px #fff36b, 0 0 58px #ff9d00, 0 0 90px rgba(255,74,0,.92)";
  }

  const innerGlow = document.createElement("span");
  Object.assign(innerGlow.style, {
    position: "absolute",
    inset: "-8px",
    borderRadius: "999px",
    border: "2px solid rgba(255,244,130,.72)",
    boxShadow:
      "0 0 18px rgba(255,255,255,.85), inset 0 0 18px rgba(255,221,65,.9)",
  });

  const trail = document.createElement("span");
  Object.assign(trail.style, {
    position: "absolute",
    left: "-78px",
    top: "14px",
    width: "92px",
    height: "16px",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg, rgba(255,93,0,0), rgba(255,170,0,.42), rgba(255,226,74,.72), rgba(255,255,255,.98))",
    filter: "blur(5px)",
    transformOrigin: "right center",
  });

  const sparkleOne = document.createElement("span");
  const sparkleTwo = document.createElement("span");

  for (const [sparkle, left, top] of [
    [sparkleOne, "-22px", "-12px"],
    [sparkleTwo, "-42px", "34px"],
  ] as const) {
    Object.assign(sparkle.style, {
      position: "absolute",
      left,
      top,
      width: "9px",
      height: "9px",
      borderRadius: "999px",
      background: "#ffffff",
      boxShadow: "0 0 12px #fff6a3, 0 0 22px #ff9d00",
    });
  }

  light.appendChild(trail);
  light.appendChild(innerGlow);
  light.appendChild(sparkleOne);
  light.appendChild(sparkleTwo);
  document.body.appendChild(light);

  const animation = light.animate(
    [
      {
        transform: "translate(-50%, -50%) scale(.22) rotate(-8deg)",
        opacity: 0,
        offset: 0,
      },
      {
        transform: "translate(-50%, -50%) scale(1.28) rotate(0deg)",
        opacity: 1,
        offset: 0.12,
      },
      {
        transform: `translate(calc(-50% + ${deltaX * 0.26}px), calc(-50% + ${
          deltaY * 0.12 - lift * 0.72
        }px)) scale(1.18) rotate(8deg)`,
        opacity: 1,
        offset: 0.34,
      },
      {
        transform: `translate(calc(-50% + ${deltaX * 0.52}px), calc(-50% + ${
          deltaY * 0.34 - lift
        }px)) scale(1.05) rotate(16deg)`,
        opacity: 1,
        offset: 0.58,
      },
      {
        transform: `translate(calc(-50% + ${deltaX * 0.78}px), calc(-50% + ${
          deltaY * 0.68 - lift * 0.46
        }px)) scale(.78) rotate(24deg)`,
        opacity: 0.96,
        offset: 0.82,
      },
      {
        transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(.08) rotate(34deg)`,
        opacity: 0,
        offset: 1,
      },
    ],
    {
      duration: 1320,
      easing: "cubic-bezier(.18,.72,.2,1)",
      fill: "forwards",
    },
  );

  animation.finished.catch(() => undefined).finally(() => light.remove());
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
    {
      duration: 560,
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
      const productVisual =
        card?.querySelector<HTMLElement>(".product-visual");

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

        window.setTimeout(() => bounceCart(target), 1160);
      }, 80);
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
