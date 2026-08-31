const CACHE_NAME = 'roxsan-v3';
// NOTE: do NOT pre-cache /manifest.json — it must always be fetched fresh so
// installed PWAs pick up branding/name updates instead of serving a stale copy.
const urlsToCache = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Gracefully handle missing assets
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Never cache responses for URLs that carry an access_token — these are auth
// redirects and must not be persisted or replayed from cache.
function hasAccessToken(url) {
  try {
    return new URL(url).searchParams.has('access_token');
  } catch {
    return url.indexOf('access_token=') !== -1;
  }
}

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = event.request.url;

  // Network-first for API calls
  if (url.includes('/api') || url.includes('base44')) {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Network-first for the web manifest so install/update always reads the
  // current branding (name, theme color, icons) instead of a stale cached copy.
  if (url.endsWith('/manifest.json')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type !== 'error') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Network first for navigation requests (HTML shell) — ensures meta/tracking
  // updates always load fresh instead of serving a stale cached page.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        // Don't persist auth-redirect URLs (token in query string).
        if (!hasAccessToken(event.request.url)) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        return caches.match(event.request).then((cached) => cached || caches.match('/'));
      })
    );
    return;
  }

  // Cache first for static assets — but never for token-bearing URLs.
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error' || hasAccessToken(event.request.url)) {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        return caches.match(event.request);
      })
    })
  );
});
