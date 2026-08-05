"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    firebase?: {
      apps: unknown[];
      initializeApp: (config: Record<string, string>) => unknown;
      messaging: () => {
        getToken: (options: { vapidKey: string; serviceWorkerRegistration: ServiceWorkerRegistration }) => Promise<string>;
      };
    };
  }
}

const firebaseConfig = {
  apiKey: "AIzaSyDbMNVCNRSIigghquZQ96OBrRrrFN131dU",
  authDomain: "sabka-delivery.firebaseapp.com",
  projectId: "sabka-delivery",
  storageBucket: "sabka-delivery.firebasestorage.app",
  messagingSenderId: "979418462252",
  appId: "1:979418462252:web:7aeed3a4f5d9ba141c7989",
};

const vapidKey = "BCCWD92l1hSPVOA6SqUSgduJffBrs1X14kU_6ip2vILy2YhaaYbvBZV0kc5LkdwLBA9sFx7AsBlL33DLFFC9zhQ";

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "1") resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    document.head.appendChild(script);
  });
}

async function registerPush() {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
  if (Notification.permission === "denied") return;

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();
  if (permission !== "granted") return;

  await loadScript("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
  await loadScript("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");
  if (!window.firebase) return;
  if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);

  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  await registration.update();
  const token = await window.firebase.messaging().getToken({
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) return;

  const pathname = window.location.pathname;
  const panel = pathname.startsWith("/super-admin")
    ? "SUPER_ADMIN"
    : pathname.startsWith("/rider-panel")
      ? "RIDER"
      : pathname.startsWith("/grocery-panel")
        ? "GROCERY"
        : pathname.startsWith("/electronics-panel")
          ? "ELECTRONICS"
          : pathname.startsWith("/restaurant-panel")
            ? "RESTAURANT"
            : "CUSTOMER";

  await fetch("/api/push-subscriptions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, panel }),
  });
}

export default function PushNotifications() {
  useEffect(() => {
    if (Notification.permission === "granted") void registerPush().catch(() => {});

    const onClick = (event: MouseEvent) => {
      const element = (event.target as HTMLElement | null)?.closest("button,a");
      const text = element?.textContent?.toLowerCase() || "";
      if (text.includes("enable alerts") || text.includes("alerts on") || text.includes("notification")) {
        void registerPush().catch(() => {});
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
