// Bump the cache name any time the caching strategy changes.
// The activate handler deletes all caches NOT matching CACHE_NAME,
// so incrementing the version clears stale assets from old deployments.
const CACHE_NAME = 'mwt-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Navigation requests (HTML) → network-first so users always get the
  // latest index.html (and therefore the latest JS bundle hash) after a deploy.
  // Fall back to cached '/' only when offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  // Vite hashed bundles (e.g. index-AbCd1234.js) are content-addressed and
  // immutable, so cache-first is safe and fast.
  if (url.pathname.match(/\.[0-9a-f]{8}\.(js|css)$/i)) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(event.request, response.clone()));
            }
            return response;
          })
      )
    );
    return;
  }

  // Everything else (images, fonts, API calls that slip through) →
  // network-first with a cache fallback for offline resilience.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
