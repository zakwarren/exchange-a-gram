self.addEventListener('install', function(event) {
    console.log('[Service worker] Installing Service Worker...', event);
    event.waitUntil(
        caches.open('static')
            .then(function(cache) {
                console.log('[Service worker] Pre-caching app shell');
                cache.add('/src/js/app.js');
            })
    );
});

self.addEventListener('activate', function(event) {
    console.log('[Service worker] Activating Service Worker...', event);
    return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                } else {
                    return fetch(event.request);
                }
            })
    );
});
