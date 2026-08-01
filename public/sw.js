const CACHE_NAME = "sabka-delivery-app-v6";
const DATA_CACHE = "sabka-delivery-data-v1";
const IMAGE_CACHE = "sabka-delivery-images-v1";
const STATIC_CACHE = "sabka-delivery-static-v1";

const APP_SHELL = [
  "/offline.html",
  "/manifest.webmanifest",
  "/images/sabka-delivery-logo.png",
];

function showSabkaNotification(payload) {
  return self.registration.showNotification(payload.title || "Sabka Delivery", {
    body: payload.body || "You have a new update.",
    icon: "/images/sabka-delivery-logo.png",
    badge: "/images/sabka-delivery-logo.png",
    data: { url: payload.url || "/" },
    tag: payload.tag || "sabka-delivery-update",
    renotify: true,
  });
}

function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(request, { signal: controller.signal }).finally(() => {
    clearTimeout(timer);
  });
}

async function cacheSuccessfulResponse(cacheName, request, response) {
  if (!response || !response.ok || response.type === "opaque") return response;

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  return response;
}

async function networkFirstWithFallback(request, cacheName, timeoutMs) {
  try {
    const response = await fetchWithTimeout(request, timeoutMs);
    return await cacheSuccessfulResponse(cacheName, request, response);
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error("Network unavailable and no cached response");
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const refresh = fetch(request)
    .then((response) => cacheSuccessfulResponse(cacheName, request, response))
    .catch(() => undefined);

  if (cached) {
    void refresh;
    return cached;
  }

  const response = await refresh;
  if (response) return response;
  throw new Error("Resource unavailable");
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
  const allowedCaches = new Set([
    CACHE_NAME,
    DATA_CACHE,
    IMAGE_CACHE,
    STATIC_CACHE,
  ]);

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                (key.startsWith("sabka-delivery-") ||
                  key.startsWith("sabka-delivery-app-")) &&
                !allowedCaches.has(key),
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
      fetch(request, { cache: "no-store" }).catch(() =>
        caches.match("/offline.html"),
      ),
    );
    return;
  }

  if (url.pathname === "/api/market") {
    event.respondWith(
      networkFirstWithFallback(request, DATA_CACHE, 2200).catch(() =>
        Response.json(
          { error: "Catalog abhi load nahi hua" },
          { status: 503 },
        ),
      ),
    );
    return;
  }

  if (url.pathname === "/api/market-version") {
    event.respondWith(fetch(request).catch(() => new Response("", { status: 503 })));
    return;
  }

  if (
    url.pathname.startsWith("/images/") ||
    url.pathname === "/manifest.webmanifest" ||
    request.destination === "image"
  ) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font"
  ) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});

self.addEventListener("push", (event) => {
  let payload = { title: "Sabka Delivery", body: "You have a new update." };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  event.waitUntil(showSabkaNotification(payload));
});

self.addEventListener("message", (event) => {
  const payload = event.data || {};
  if (payload.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (payload.type !== "SABKA_NOTIFY") return;
  event.waitUntil(showSabkaNotification(payload));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || "/",
    self.location.origin,
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(target);
            return client.focus();
          }
        }
        return self.clients.openWindow(target);
      }),
  );
});
