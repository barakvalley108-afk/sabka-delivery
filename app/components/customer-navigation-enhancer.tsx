"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const cleanText = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase();

export default function CustomerNavigationEnhancer() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== "/") return;

    const enhance = () => {
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
      const historyButton = buttons.find((button) => {
        const text = cleanText(button.textContent || "");
        return text === "history" || text === "order history";
      });

      if (!historyButton || !historyButton.parentElement) return;

      const nav = historyButton.parentElement;
      nav.dataset.customerNav = "true";

      if (!nav.querySelector<HTMLButtonElement>("[data-profile-nav='true']")) {
        const profileButton = historyButton.cloneNode(true) as HTMLButtonElement;
        profileButton.classList.remove("active");
        profileButton.dataset.profileNav = "true";
        profileButton.type = "button";
        profileButton.innerHTML = "<span aria-hidden='true'>👤</span><span>Profile</span>";
        profileButton.addEventListener("click", () => router.push("/profile"));
        nav.appendChild(profileButton);
      }

      const childButtons = Array.from(nav.querySelectorAll<HTMLButtonElement>(":scope > button"));
      if (childButtons.length >= 5) {
        nav.style.gridTemplateColumns = "repeat(5, minmax(0, 1fr))";
      }
    };

    const clickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;
      const text = cleanText(button.textContent || "");
      if (text === "history" || text === "order history") {
        event.preventDefault();
        event.stopPropagation();
        router.push("/orders");
      }
    };

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", clickHandler, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", clickHandler, true);
    };
  }, [pathname, router]);

  return null;
}
