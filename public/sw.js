var CACHE_STATIC_NAME = 'static-v4';
var CACHE_DYNAMIC_NAME = 'dynamic-v4';

self.addEventListener('install', function(event) {
    console.log('[Service worker] Installing Service Worker...', event);
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME)
            .then(function(cache) {
                console.log('[Service worker] Pre-caching app shell');
                cache.addAll([
                    '/',
                    '/index.html',
                    '/offline.html',
                    '/src/js/app.js',
                    '/src/js/feed.js',
                    '/src/js/promise.js',
                    '/src/js/fetch.js',
                    '/src/js/material.min.js',
                    '/src/css/app.css',
                    '/src/css/feed.css',
                    '/src/images/main-image.jpg',
                    'https://fonts.googleapis.com/css?family=Roboto:400,700',
                    'https://fonts.googleapis.com/icon?family=Material+Icons',
                    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
                ]);
            })
    );
});

self.addEventListener('activate', function(event) {
    console.log('[Service worker] Activating Service Worker...', event);
    event.waitUntil(
        caches.keys()
            .then(function(keyList) {
                return Promise.all(keyList.map(function(key) {
                    if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                        console.log('[Service worker] Removing old cache:', key);
                        return caches.delete(key);
                    }
                }));
            })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
    var url = 'https://httpbin.org/get';

    if (event.request.url.indexOf(url) > -1) {
        // cache then network strategy
        // for regularly updated responses
        // uses cache if offline and for speed
        // but prefers network and updates cache
        event.respondWith(
            caches.open(CACHE_DYNAMIC_NAME)
                .then(function(cache) {
                    return fetch(event.request)
                        .then(function(res) {
                            cache.put(event.request, res.clone());
                            return res;
                        });
                })
        );
    } else {
        // cache with network fallback strategy
        // for responses that don't update regularly
        // uses cache if available, falling back to network
        // to cache responses the first time (or when service worker updated)
        event.respondWith(
            caches.match(event.request)
                .then(function(response) {
                    if (response) {
                        return response;
                    } else {
                        return fetch(event.request)
                            .then(function(res) {
                                return caches.open(CACHE_DYNAMIC_NAME)
                                    .then(function(cache) {
                                        cache.put(event.request.url, res.clone());
                                        return res;
                                    });
                            })
                            .catch(function(err) {
                                return caches.open(CACHE_STATIC_NAME)
                                    .then(function(cache) {
                                        return cache.match('/offline.html');
                                    })
                            });
                    }
                })
        );
    }
    
});
