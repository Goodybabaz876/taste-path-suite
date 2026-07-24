/* =========================================================
   ELIZADE FOODS — Service Worker  (public/sw.js)
   Strategy:
     • App shell + static assets  →  Cache-first (offline works)
     • Supabase API calls         →  Network-first (fresh data)
     • Navigation requests        →  Network-first, fall back to shell
   ========================================================= */

const CACHE_NAME = "elizade-v1";
const SHELL_URLS = [
  "/",
  "/cart",
  "/orders",
  "/account",
  "/auth",
];

// ── Install: pre-cache the app shell ──────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(SHELL_URLS).catch(() => {
        /* non-fatal — shell may not be available during first install */
      })
    )
  );
  self.skipWaiting();
});

// ── Activate: purge old caches ────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: route strategy ─────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and browser-extension requests
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // Supabase API → network-first, no cache
  if (url.hostname.includes("supabase.co")) {
    event.respondWith(fetch(request).catch(() => new Response("", { status: 503 })));
    return;
  }

  // Static assets (JS/CSS/images/fonts) → cache-first
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|png|jpg|jpeg|webp|svg|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // Navigation (HTML) → network-first, fall back to cached shell "/"
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match("/").then((r) => r || new Response("Offline", { status: 503 })))
    );
    return;
  }
});
