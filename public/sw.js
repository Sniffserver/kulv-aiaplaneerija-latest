// KÜLV Progressive Web App Service Worker
// Architecture: Multi-tier caching with dedicated strategies per resource category:
// - App Shell & Navigation: CacheFirst with offline fallback
// - Hashed static assets (/assets/*): CacheFirst (immutable content hashes)
// - Static assets (icons, fonts, images): CacheFirst
// - Weather API (Open-Meteo): NetworkFirst with offline cache fallback
// - Backend API (/api/*) & Home Assistant: NetworkOnly (strictly bypass cache)

// The production build stamps this ID from index.html and the precache manifest.
// Each installed worker therefore writes only to its own cache namespace. If install
// fails, the active worker keeps serving the previous, complete cache set.
const BUILD_ID = 'dev';

const CACHE_NAMES = {
  APP_SHELL: `kulv-app-shell-${BUILD_ID}`,
  ASSETS: `kulv-assets-${BUILD_ID}`,
  STATIC: `kulv-static-${BUILD_ID}`,
  WEATHER: `kulv-weather-${BUILD_ID}`,
};

// CacheStorage is shared by all apps on an origin. Own only these exact namespaces;
// a broad "kulv-" prefix can accidentally delete offline data owned by another app.
const OWNED_CACHE_PREFIXES = [
  'kulv-app-shell-',
  'kulv-assets-',
  'kulv-static-',
  'kulv-weather-',
];

// Avoid a global CacheStorage search for app resources: it can see a partially populated
// cache from an installing worker. Limit every lookup to the namespace of this worker.
async function matchInCache(cacheName, request, options) {
  const cache = await caches.open(cacheName);
  return cache.match(request, options);
}

async function matchCurrentCaches(request, options) {
  for (const cacheName of Object.values(CACHE_NAMES)) {
    const response = await matchInCache(cacheName, request, options);
    if (response) return response;
  }
  return undefined;
}

const SCOPE = self.registration ? self.registration.scope : '/';

// Critical core precache required for offline bootstrap
const CRITICAL_PRECACHE_URLS = [
  SCOPE,
  new URL('index.html', SCOPE).toString(),
  new URL('manifest.json', SCOPE).toString(),
  new URL('icon.svg', SCOPE).toString(),
  new URL('precache-manifest.json', SCOPE).toString(),
];

// Secondary icon assets cached without failing install
const SECONDARY_APP_SHELL_URLS = [
  new URL('icons/icon-192.png', SCOPE).toString(),
  new URL('icons/icon-512.png', SCOPE).toString(),
  new URL('icons/maskable-512.png', SCOPE).toString(),
  new URL('icons/apple-touch-icon.png', SCOPE).toString(),
];

// 1. Install Phase: Precache essential App Shell & build asset manifest
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.APP_SHELL).then(async (shellCache) => {
      // 1. First ensure critical app shell URLs are cached
      // A worker without the shell or its JavaScript chunks is not a usable offline worker.
      // Fail installation atomically so the currently active worker remains available.
      await shellCache.addAll(CRITICAL_PRECACHE_URLS);

      // Precache build-generated JavaScript & CSS chunks if manifest is provided
      try {
        const manifestUrl = new URL('precache-manifest.json', SCOPE).toString();
        const manifestResp = await fetch(manifestUrl, { cache: 'no-store' });
        if (manifestResp.ok) {
          const files = await manifestResp.json();
          if (Array.isArray(files) && files.length > 0) {
            const validFiles = files.filter(
              (file) => typeof file === 'string' && file.startsWith('assets/') && (file.endsWith('.js') || file.endsWith('.css'))
            );
            if (validFiles.length > 0) {
              const assetUrls = validFiles.map((file) => new URL(file, SCOPE).toString());
              const assetCache = await caches.open(CACHE_NAMES.ASSETS);
              await assetCache.addAll(assetUrls);
              console.log(`[SW] Successfully precached ${assetUrls.length} build modules.`);
            }
          } else {
            console.log('[SW] Precache manifest empty or not generated yet; runtime cache will handle assets.');
          }
        }
      } catch (manifestErr) {
        console.warn('[SW] Notice: Precache manifest not populated, continuing with core app shell:', manifestErr);
      }

      // 3. Cache secondary icons in background
      try {
        await shellCache.addAll(SECONDARY_APP_SHELL_URLS);
      } catch (err) {
        console.warn('[SW] Secondary icon precache warning:', err);
      }
    })
  );
  // Do NOT skipWaiting automatically here; wait for user confirmation via SKIP_WAITING message
});

// 2. Activate Phase: Purge obsolete legacy KÜLV caches (scoped to kulv- prefix)
self.addEventListener('activate', (event) => {
  const currentCaches = Object.values(CACHE_NAMES);
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // Remove only known KÜLV cache namespaces, not unrelated caches with similar names.
          const isOwnedCache = OWNED_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix));
          if (isOwnedCache && !currentCaches.includes(key)) {
            console.log('[SW] Purging outdated KÜLV cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. User-controlled update lifecycle
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING command, activating new service worker.');
    self.skipWaiting();
  }
});

// 4. Fetch Strategy Dispatcher
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Strategy E: NetworkOnly for backend APIs and Home Assistant
  // Never cache API sync state, sensors, telemetry, or server endpoints
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('homeassistant') ||
    url.port === '8123'
  ) {
    return; // Pass through directly to network
  }

  // Strategy D: Weather API (Open-Meteo) -> NetworkFirst with offline cache fallback
  if (url.hostname.includes('open-meteo.com')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAMES.WEATHER).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await matchInCache(CACHE_NAMES.WEATHER, event.request);
          if (cached) return cached;
          return new Response(JSON.stringify({ offline: true, error: 'Offline' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
          });
        })
    );
    return;
  }

  // Local fonts (/fonts/*) -> CacheFirst
  if (url.pathname.includes('/fonts/')) {
    event.respondWith(
      matchInCache(CACHE_NAMES.STATIC, event.request, { ignoreVary: true }).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAMES.STATIC).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Cross-origin static assets: Google Fonts -> CacheFirst
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
    event.respondWith(
      matchInCache(CACHE_NAMES.STATIC, event.request, { ignoreVary: true }).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAMES.STATIC).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Same-origin requests:
  if (url.origin === self.location.origin) {
    // Strategy A: Cache-first app-shell navigation.
    // A cached shell must be returned immediately while offline; never wait for a
    // navigation network request when a usable document is already available.
    if (event.request.mode === 'navigate') {
      event.respondWith(
        (async () => {
          const cachedNavigation = await matchInCache(CACHE_NAMES.APP_SHELL, event.request, { ignoreVary: true });
          if (cachedNavigation) return cachedNavigation;

          const cachedIndex = await matchInCache(CACHE_NAMES.APP_SHELL, new URL('index.html', SCOPE).toString());
          if (cachedIndex) return cachedIndex;

          const cachedScope = await matchInCache(CACHE_NAMES.APP_SHELL, SCOPE);
          if (cachedScope) return cachedScope;

          // First-ever visit: no shell has been cached yet, so network access is required.
          try {
            const response = await fetch(event.request);
            if (response && response.status === 200) {
              const cache = await caches.open(CACHE_NAMES.APP_SHELL);
              await Promise.all([
                cache.put(event.request, response.clone()),
                cache.put(new URL('index.html', SCOPE).toString(), response.clone()),
              ]);
            }
            return response;
          } catch {
            return new Response('KÜLV on võrguühenduseta ja rakenduse vahemälu pole saadaval.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
          }
        })()
      );
      return;
    }

    // Strategy B: Hashed static assets (/assets/*.js, /assets/*.css) -> CacheFirst
    // These contain immutable content hashes in their filename
    if (url.pathname.includes('/assets/')) {
      event.respondWith(
        matchInCache(CACHE_NAMES.ASSETS, event.request, { ignoreVary: true }).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAMES.ASSETS).then((cache) => {
                cache.put(event.request, clone);
              });
            }
            return networkResponse;
          }).catch(async () => {
            // Hashed assets are immutable; ignore Vary differences between pre-cache
            // and browser script/style requests when falling back offline.
            const precached = await matchInCache(CACHE_NAMES.ASSETS, event.request, { ignoreVary: true });
            if (precached) return precached;
            return new Response('Offline asset unavailable: ' + url.pathname, {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
          });
        })
      );
      return;
    }

    // Strategy C: Other local static assets (icons, manifest, svgs) -> StaleWhileRevalidate
    event.respondWith(
      matchCurrentCaches(event.request, { ignoreVary: true }).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAMES.STATIC).then((cache) => {
                cache.put(event.request, clone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
