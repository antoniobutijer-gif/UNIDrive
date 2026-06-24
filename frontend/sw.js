// ============================================================================
//  UNIDrive – Service Worker (PWA)
//  Omogućuje instalaciju na početni zaslon i rad bez mreže (offline shell).
//  Bumpni CACHE verziju kad mijenjaš statičke datoteke da se osvježi keš.
// ============================================================================
const CACHE = 'unidrive-v1';
const ASSETS = [
  './UNIDrive.html',
  './support.js',
  './ios-frame.jsx',
  './config.js',
  './manifest.json',
  './icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Samo GET zahtjevi istog porijekla idu kroz keš.
  // API pozivi (drugi origin, npr. Render) uvijek idu na mrežu.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match('./UNIDrive.html'));
    })
  );
});
