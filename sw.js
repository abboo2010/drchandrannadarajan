// Minimal service worker — exists mainly so Chrome/Android recognizes this
// page as an installable app (a real "Install app" prompt instead of a
// plain bookmark). It caches only the small app-shell files, not the video.
const CACHE_NAME = 'meditouch-shell-v11';
const SHELL_FILES = [
  './index.html',
  './style.css',
  './image-data.js',
  './data.js',
  './content-data.js',
  './script.js',
  './sheets-loader.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
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
