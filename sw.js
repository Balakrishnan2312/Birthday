const CACHE_NAME = 'birthday-3d-v8';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './admin.html',
  './admin.js',
  './style.css',
  './main.js',
  './shobanaQuiz.js',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
  './IMG_0027.JPG',
  './IMG_2952.JPG',
  './photo2.jpg',
  './photo3.jpg',
  './photo4.jpg',
  './photo5.jpeg',
  './photo6.jpeg',
  './photo10.jpeg',
  './photo11.jpeg',
  './Megham Karukathu Bgm.mp3',
  './Kekaamale Unakena Thara Uyir Irukkudhu - Chella Magale _ Jana Nayagan _ Tamil.mp3',
  './video/IMG_2945.MP4',
  './video/IMG_2947.MP4',
  './video/IMG_2949.MP4',
  './video/WhatsApp Video 2025-12-23 at 8.36.05 PM.mp4',
  './video/WhatsApp Video 2025-12-23 at 8.36.06 PM.mp4'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell & assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
