const CACHE_NAME = "sabka-delivery-app-v4";
const APP_SHELL = [
  "/offline.html",
  "/manifest.webmanifest",
  "/images/sabka-delivery-logo.png"
];

function showSabkaNotification(payload) {
  return self.registration.showNotification(payload.title || "Sabka Delivery", {
    body: payload.body || "You have a new update.",
    icon: "/images/sabka-delivery-logo.png",
    badge: "/images/sabka-delivery-logo.png",
    data: { url: payload.url || "/" },
    tag: payload.tag || "sabka-delivery-update",
    renotify: true
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        APP_SHELL.map((url) =>
          cache.add(new Request(url, { cache: "reload" })),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("sabka-delivery-app-") && key !== CACHE_NAME,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  if (url.pathname.startsWith("/images/") || url.pathname === "/manifest.webmanifest") {
    event.respondWith(
      fetch(request, { cache: "no-cache" })
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => caches.match(request)),
    );
  }
});

self.addEventListener("push", (event) => {
  let payload = { title: "Sabka Delivery", body: "You have a new update." };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  event.waitUntil(
    showSabkaNotification(payload)
  );
});

self.addEventListener("message", (event) => {
  const payload = event.data || {};
  if (payload.type !== "SABKA_NOTIFY") return;
  event.waitUntil(showSabkaNotification(payload));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
