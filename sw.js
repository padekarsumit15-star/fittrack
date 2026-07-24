const CACHE = "fittrack-v2";

const FILES = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/foods.js",
  "./js/storage.js",
  "./js/app.js",
  "./manifest.json"
];

/* Save app files for offline use */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
  );

  self.skipWaiting();
});

/* Remove old cache versions */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

/* Load cached files when offline */
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        return cached || fetch(event.request);
      })
  );
});