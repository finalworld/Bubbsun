const CACHE_NAME = "rk-kassa-v6";
const APP_SHELL = ["/rk/", "/rk/manifest.webmanifest", "/rk/home-icon.png", "/rk/rk-upplands-bro-logo.png", "/rk/calculator-icon.png", "/rk/swish.png", "/rk/sale-whoosh.mp3"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    if (new URL(event.request.url).origin === self.location.origin) {
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("/rk/"))));
});
