const CACHE_VERSION = "akinfolu-shell-v2";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/tab_logo/akf.svg"];

const isServerDataRequest = (url) =>
  url.pathname === "/api" ||
  url.pathname.startsWith("/api/") ||
  url.pathname === "/backend" ||
  url.pathname.startsWith("/backend/");

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_URLS" || !Array.isArray(event.data.urls)) return;
  const cacheableUrls = event.data.urls.filter((value) => {
    try {
      const url = new URL(value, self.location.origin);
      return url.origin === self.location.origin && !isServerDataRequest(url);
    } catch {
      return false;
    }
  });
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.all(cacheableUrls.map((url) => cache.add(url).catch(() => undefined)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // API data must never be served cache-first. Server-state freshness is
  // managed by the application query cache and live invalidation channel.
  if (isServerDataRequest(url)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
