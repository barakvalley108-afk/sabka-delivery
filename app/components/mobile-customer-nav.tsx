"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ForgotPinSupport from "./forgot-pin-support";

type ActiveKey = "cart" | "food" | "grocery" | "orders" | "profile";
type HomeTarget = "food" | "grocery";

const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase();
const readCount = (element: Element | null) => {
  const source = `${element?.getAttribute("aria-label") || ""} ${element?.textContent || ""}`;
  const matches = source.match(/\d+/g);
  return matches?.length ? Number(matches[matches.length - 1]) : 0;
};

export default function MobileCustomerNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState<ActiveKey>("food");
  const [cartCount, setCartCount] = useState(0);
  const pendingHomeTarget = useRef<HomeTarget | null>(null);

  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/orders");
    router.prefetch("/profile");
  }, [router]);

  useEffect(() => {
    if (pathname === "/orders") setActive("orders");
    else if (pathname === "/profile") setActive("profile");
  }, [pathname]);

  function findOldButton(label: "cart" | "food" | "grocery") {
    const oldNav = document.querySelector<HTMLElement>(".mobile-nav");
    const buttons = Array.from(oldNav?.querySelectorAll<HTMLButtonElement>("button") || []);
    return buttons.find((entry) => normalize(entry.textContent || "").includes(label));
  }

  function clickOldButton(label: "cart" | "food" | "grocery") {
    const button = findOldButton(label);
    if (!button) return false;
    setActive(label);
    button.click();
    return true;
  }

  useEffect(() => {
    if (pathname !== "/") {
      setCartCount(0);
      return;
    }

    const syncActive = () => {
      const oldNav = document.querySelector<HTMLElement>(".mobile-nav");
      if (!oldNav) return;
      oldNav.style.display = "none";

      if (pendingHomeTarget.current) {
        const target = pendingHomeTarget.current;
        if (clickOldButton(target)) pendingHomeTarget.current = null;
      }

      const oldCartButton = findOldButton("cart");
      const headerCart = document.querySelector<HTMLElement>(".header-cart");
      setCartCount(Math.max(readCount(oldCartButton), readCount(headerCart)));

      const activeButton = oldNav.querySelector<HTMLButtonElement>("button.active");
      const text = normalize(activeButton?.textContent || "");
      if (text.includes("grocery")) setActive("grocery");
      else if (text.includes("cart")) setActive("cart");
      else if (text.includes("food")) setActive("food");
    };

    syncActive();
    const observer = new MutationObserver(syncActive);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style", "aria-label"],
    });

    const timer = window.setInterval(syncActive, 400);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [pathname]);

  function openHomeSection(target: HomeTarget) {
    setActive(target);

    if (pathname === "/") {
      clickOldButton(target);
      return;
    }

    pendingHomeTarget.current = target;
    router.push("/");
  }

  function openRoute(path: "/orders" | "/profile", key: "orders" | "profile") {
    if (pathname === path) return;
    setActive(key);
    router.push(path);
  }

  const showNav = ["/", "/orders", "/profile"].includes(pathname);

  return (
    <>
      <ForgotPinSupport />
      {showNav && (
        <nav className="customer-mobile-nav" aria-label="Customer navigation">
          <button
            aria-label={`Cart mein ${cartCount} items`}
            className={active === "cart" ? "active" : ""}
            onPointerDown={() => pathname === "/" && findOldButton("cart")}
            onClick={() => {
              if (pathname === "/") clickOldButton("cart");
              else router.push("/");
            }}
          >
            <span className="customer-cart-icon">
              🛒
              {cartCount > 0 ? <b>{cartCount > 99 ? "99+" : cartCount}</b> : null}
            </span>
            <small>Cart</small>
          </button>
          <button className={active === "food" ? "active" : ""} onClick={() => openHomeSection("food")}>
            <span>🍲</span>
            <small>Food</small>
          </button>
          <button className={active === "grocery" ? "active" : ""} onClick={() => openHomeSection("grocery")}>
            <span>🛍️</span>
            <small>Grocery</small>
          </button>
          <button
            className={active === "orders" ? "active" : ""}
            onPointerEnter={() => router.prefetch("/orders")}
            onTouchStart={() => router.prefetch("/orders")}
            onClick={() => openRoute("/orders", "orders")}
          >
            <span>▤</span>
            <small>Orders</small>
          </button>
          <button
            className={active === "profile" ? "active" : ""}
            onPointerEnter={() => router.prefetch("/profile")}
            onTouchStart={() => router.prefetch("/profile")}
            onClick={() => openRoute("/profile", "profile")}
          >
            <span>👤</span>
            <small>Profile</small>
          </button>
        </nav>
      )}
      <style jsx global>{`
        .customer-mobile-nav { display: none; }
        @media (max-width: 680px) {
          body { padding-bottom: 76px !important; }
          body:has(.customer-access-shell) { padding-bottom: 0 !important; }
          .mobile-nav { display: none !important; }
          .customer-mobile-nav {
            position: fixed;
            z-index: 99999;
            left: 0;
            right: 0;
            bottom: 0;
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            min-height: 72px;
            padding: 5px 6px max(5px, env(safe-area-inset-bottom));
            background: rgba(255,255,255,.98);
            border-top: 1px solid #eadfd8;
            box-shadow: 0 -8px 24px rgba(52,25,18,.12);
            contain: layout paint;
          }
          .customer-mobile-nav button {
            min-width: 0;
            min-height: 62px;
            border: 0;
            border-radius: 15px;
            background: transparent;
            color: #392722;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 4px;
            font: inherit;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
          .customer-mobile-nav button span { font-size: 22px; line-height: 1; }
          .customer-mobile-nav button small { font-size: 11px; font-weight: 900; }
          .customer-mobile-nav button.active { background: #fff0eb; color: #c7181b; }
          .customer-mobile-nav .customer-cart-icon { position: relative; display: inline-grid; place-items: center; }
          .customer-mobile-nav .customer-cart-icon b {
            position: absolute;
            top: -9px;
            right: -13px;
            min-width: 19px;
            height: 19px;
            padding: 0 5px;
            display: grid;
            place-items: center;
            border: 2px solid #fff;
            border-radius: 999px;
            background: #c7181b;
            color: #fff;
            box-shadow: 0 3px 8px rgba(199,24,27,.35);
            font-size: 10px;
            font-weight: 950;
            line-height: 1;
          }
        }
      `}</style>
    </>
  );
}
