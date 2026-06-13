const VERSION = 'v1';
const cacheName = `linkspot${VERSION}`;

const filesToCache = [
  '/',
  '/index.html',
  '/g.html',
  '/a.html',
  '/s.html',
  '/education.html',
  '/sw.js',
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll(filesToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(
        keyList.map(function (key) {
          if (key.startsWith('linkspot') && key !== cacheName) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  // Don't cache proxy requests
  if (e.request.url.startsWith('/edu/') || e.request.url.startsWith('/cdn/')) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function (response) {
      if (response) {
        return response;
      }
      return fetch(e.request).catch(function() {
        // Return a basic offline response if fetch fails
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});