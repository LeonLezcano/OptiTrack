/**
 * OptiTrack - Enterprise Service Worker
 * Soporte Offline-First profesional y rotacion atomica de cache
 * AiAppFactory Standard
 */

const CACHE_NAME = 'optitrack-cache-v1.0.02';
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icon.svg',
  './version.json',
  './src/main.js',
  './src/sw-register.js',
  './src/core/lensometerQualitySentinel.js',
  './src/core/materialsCatalog.js',
  './src/core/opticalTransposer.js',
  './src/services/exportService.js',
  './src/services/opticalOrderService.js',
  './src/services/optiTrackCache.service.js',
  './src/services/whatsAppOpticNotifier.service.js',
  './src/utils/cryptoSeal.js',
  './src/utils/formatters.js',
  './src/utils/sanitizer.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key.startsWith('optitrack-cache-') && key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isHtmlOrVersion =
    event.request.mode === 'navigate' ||
    event.request.headers.get('accept')?.includes('text/html') ||
    url.pathname.endsWith('/version.json') ||
    url.pathname === '/index.html' ||
    url.pathname === '/';

  if (isHtmlOrVersion) {
    // Network-First con fallback a cache para HTML y version.json
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  // Cache-First con refresco en background para assets estaticos
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
