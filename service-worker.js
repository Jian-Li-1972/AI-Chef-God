const CACHE_NAME = 'ai-chef-god-v1';
const ICON_DATA_URL = 'data:image/png;base64,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';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Serve the icon from base64 data, as we cannot create physical image files.
  if (url.pathname === '/icon-192.png' || url.pathname === '/icon-512.png') {
    event.respondWith(fetch(ICON_DATA_URL));
    return;
  }
  
  // For navigation requests (loading the page), use a network-first strategy.
  // This ensures users get the latest version if online, but falls back to cache if offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (!response || response.status !== 200) {
            // If network fails, try the cache.
            return caches.match(request);
          }

          // Cache the new version for next time.
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => caches.match(request)) // Network totally failed, serve from cache.
    );
    return;
  }

  // For all other requests (scripts, styles from CDNs), use a cache-first strategy.
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // Return from cache if available.
      if (cachedResponse) {
        return cachedResponse;
      }
      // Otherwise, go to the network.
      // We don't cache these dynamic/third-party assets.
      return fetch(request);
    })
  );
});

// Clean up old caches on activation.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (CACHE_NAME !== cacheName) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
