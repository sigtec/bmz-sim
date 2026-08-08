const CACHE_NAME = 'bma-fat-v1';

// Alle statischen Ressourcen für den Offline-Betrieb
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './style.css',
    './default.json',
    './js/app.js',
    './js/bmz.js',
    './js/fat.js',
    './js/fbf.js',
    './js/admin.js'
    // Falls du Icons für das PWA-Manifest hast, ergänze sie hier (z.B. './icon.png')
];

// 1. Installation: Kerndateien vorab in den Cache legen
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Vercache App-Shell Assets');
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// 2. Aktivierung: Alte Caches aufräumen
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Lösche alten Cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Fetch (Network First, Fallback to Cache)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                console.log('[Service Worker] Offline-Fallback für:', event.request.url);
                return caches.match(event.request);
            })
    );
});
