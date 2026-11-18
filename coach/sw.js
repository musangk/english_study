// Offline: cache core files, network-first so updates show up, cache fallback when offline.
const CACHE = 'voice-coach-v1';
const CORE = ['./', 'index.html', 'coach.css', 'core.js', 'app.js', 'icon.svg', 'manifest.webmanifest',
  '../css/style.css', '../packs/index.json', '../packs/en/pack.json', '../packs/ja/pack.json'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k.startsWith('voice-coach')).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
