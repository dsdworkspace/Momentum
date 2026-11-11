// Change this number whenever you update the app files, so phones fetch the new version.
const CACHE = 'momentum-v4';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  const navigation = e.request.mode === 'navigate';
  e.respondWith(
    (async () => {
      const hit = await caches.match(e.request, {ignoreSearch: true});
      if (!navigation && hit) return hit;
      try {
        const response = await fetch(e.request);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(e.request, response.clone());
        }
        return response;
      } catch {
        if (hit) return hit;
        if (navigation) return (await caches.match('./index.html')) || (await caches.match('index.html'));
        return Response.error();
      }
    })()
  );
});
