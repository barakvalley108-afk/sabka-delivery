"use client";

type BackgroundNotification = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

const icon = "/images/sabka-delivery-logo.png";
type SabkaNotificationOptions = NotificationOptions & {
  badge?: string;
  data?: unknown;
  renotify?: boolean;
};

export async function showBackgroundNotification({
  title,
  body,
  url = "/",
  tag = "sabka-delivery-update",
}: BackgroundNotification) {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return false;

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.showNotification) {
        const options: SabkaNotificationOptions = {
          body,
          icon,
          badge: icon,
          tag,
          renotify: true,
          data: { url },
        };
        await registration.showNotification(title, options);
        return true;
      }
    }
  } catch {}

  const options: SabkaNotificationOptions = {
    body,
    icon,
    badge: icon,
    tag,
    renotify: true,
    data: { url },
  };
  new Notification(title, options);
  return true;
}

export async function requestBackgroundNotifications(
  title: string,
  body: string,
  url = "/",
) {
  if (!("Notification" in window)) return false;
  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
  if (permission !== "granted") return false;
  await showBackgroundNotification({
    title,
    body,
    url,
    tag: "sabka-alerts-enabled",
  });
  return true;
}
