// Saldo PWA service worker.
// Cache strategy:
//   * static assets (HTML/CSS/JS/images) → stale-while-revalidate
//   * Supabase API requests → network-only (never serve stale data)
//   * Navigation requests → cache-first with network fallback so the app
//     opens instantly offline; data fetches still hit the network.
//
// Versioned cache name — bump CACHE_NAME to force a refresh.

const CACHE_NAME = "saldo-v1";
const STATIC_PRECACHE = [
  "/",
  "/icon.svg",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never cache Supabase or external API calls.
  if (
    url.hostname.endsWith(".supabase.co") ||
    url.hostname.endsWith(".supabase.in") ||
    url.hostname === "images.unsplash.com"
  ) {
    return; // default network behaviour
  }

  // Same-origin: stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((response) => {
            if (response && response.status === 200 && response.type === "basic") {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      }),
    );
  }
});
