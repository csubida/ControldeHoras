// Control de Horas · service worker
// Cambia VERSION cada vez que subas una versión nueva de index.html
const VERSION = 'v1-2026-10-28';
const APP = 'ch-app-' + VERSION;
const CDN = 'ch-cdn';
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-192.png', './icons/maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ch-app-') && k !== APP).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // La propia app: primero la red (para recibir actualizaciones), si no hay conexión, la copia guardada
  if (req.mode === 'navigate' || (url.origin === location.origin && url.pathname.endsWith('.html'))) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(APP).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Iconos y manifiesto: copia guardada primero
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then(m => m || fetch(req)));
    return;
  }
  // Librería de gráficos y tipografías: se guardan la primera vez que se descargan
  if (/cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url.host)) {
    e.respondWith(caches.open(CDN).then(c => c.match(req).then(m => {
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => m);
      return m || net;
    })));
  }
});
