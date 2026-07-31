"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ForgotPinSupport from "./forgot-pin-support";

type ActiveKey = "cart" | "food" | "grocery" | "orders" | "profile";

const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase();

export default function MobileCustomerNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState<ActiveKey>("food");

  useEffect(() => {
    if (pathname === "/orders") setActive("orders");
    else if (pathname === "/profile") setActive("profile");
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") return;

    const syncActive = () => {
      const oldNav = document.querySelector<HTMLElement>(".mobile-nav");
      if (!oldNav) return;
      oldNav.style.display = "none";

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
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, [pathname]);

  function clickOldButton(label: "cart" | "food" | "grocery") {
    const oldNav = document.querySelector<HTMLElement>(".mobile-nav");
    const buttons = Array.from(oldNav?.querySelectorAll<HTMLButtonElement>("button") || []);
    const button = buttons.find((entry) => normalize(entry.textContent || "").includes(label));

    if (!button) return;
    setActive(label);
    button.click();
  }

  const showNav = ["/", "/orders", "/profile"].includes(pathname);

  return (
    <>
      <ForgotPinSupport />
      {showNav && (
        <nav className="customer-mobile-nav" aria-label="Customer navigation">
          <button className={active === "cart" ? "active" : ""} onClick={() => clickOldButton("cart")}>
            <span>🛒</span>
            <small>Cart</small>
          </button>
          <button className={active === "food" ? "active" : ""} onClick={() => {
            if (pathname !== "/") router.push("/");
            window.setTimeout(() => clickOldButton("food"), 120);
          }}>
            <span>🍲</span>
            <small>Food</small>
          </button>
          <button className={active === "grocery" ? "active" : ""} onClick={() => {
            if (pathname !== "/") router.push("/");
            window.setTimeout(() => clickOldButton("grocery"), 120);
          }}>
            <span>🛍️</span>
            <small>Grocery</small>
          </button>
          <button className={active === "orders" ? "active" : ""} onClick={() => router.push("/orders")}>
            <span>▤</span>
            <small>Orders</small>
          </button>
          <button className={active === "profile" ? "active" : ""} onClick={() => router.push("/profile")}>
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
          }
          .customer-mobile-nav button span { font-size: 22px; line-height: 1; }
          .customer-mobile-nav button small { font-size: 11px; font-weight: 900; }
          .customer-mobile-nav button.active { background: #fff0eb; color: #c7181b; }
        }
      `}</style>
    </>
  );
}
