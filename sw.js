// Minimal service worker — exists mainly so Chrome/Android recognizes this
// page as an installable app (a real "Install app" prompt instead of a
// plain bookmark). It caches only the small app-shell files, not the video.
const CACHE_NAME = 'meditouch-shell-v91';
const SHELL_FILES = [
  './kiosk.html',
  './style.css',
  './data.js',
  './content-data.js',
  './script.js',
  './content-loader.js',
  './kiosk-mode.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './images/doctor.jpg',
  './images/logo.png',
  './images/splash-bg.png',
  './images/splash-bg-mobile.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
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
  // Network-first for the HTML so edits/updates show up quickly;
  // fall back to cache if offline.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ---- Push notifications (sent from /admin -> Send Notification) ----
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  const title = data.title || 'IR@SABAH';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icon-bell-192.png',
      badge: '/badge-96.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      silent: false,
      timestamp: Date.now(),
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.startsWith(self.location.origin) && 'focus' in w) {
          return w.focus().then((c) => (c && 'navigate' in c ? c.navigate(target) : c));
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
