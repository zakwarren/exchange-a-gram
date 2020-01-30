var CACHE_STATIC_NAME = 'static-v5';
var CACHE_DYNAMIC_NAME = 'dynamic-v5';
var STATIC_FILES = [
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
];

// var CACHE_LIMIT = 10;
// function trimCache(cacheName, maxItems) {
//     caches.open(cacheName)
//         .then(function(cache) {
//             return cache.keys()
//                 .then(function(keys) {
//                     if (keys.length > maxItems) {
//                         cache.delete(keys[0])
//                             .then(trimCache(cacheName, maxItems));
//                     }
//                 });
//         });
// }

self.addEventListener('install', function(event) {
    console.log('[Service worker] Installing Service Worker...', event);
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME)
            .then(function(cache) {
                console.log('[Service worker] Pre-caching app shell');
                cache.addAll(STATIC_FILES);
            })
    );
});

self.addEventListener('activate', function(event) {
    console.log('[Service worker] Activating Service Worker...', event);
    // trimCache(CACHE_DYNAMIC_NAME, CACHE_LIMIT);
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

function isInArray(string, array) {
    var cachePath;
    if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
        console.log('matched ', string);
        cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
    } else {
        cachePath = string; // store the full request (for CDNs)
    }
    return array.indexOf(cachePath) > -1;
  }

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
                            // trimCache(CACHE_DYNAMIC_NAME, CACHE_LIMIT);
                            cache.put(event.request, res.clone());
                            return res;
                        });
                })
        );
    } else if (isInArray(event.request.url, STATIC_FILES)) {
        // cache only strategy
        // only if request url is one of the static file urls
        // cache is refreshed on installation of a new version of the service worker
        // so need to remember to update the cache version numbers here
        // when updating any of the cached files
        // doesn't have a fallback so may have issues
        event.respondWith(
            caches.match(event.request)
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
                                        // trimCache(CACHE_DYNAMIC_NAME, CACHE_LIMIT);
                                        cache.put(event.request.url, res.clone());
                                        return res;
                                    });
                            })
                            .catch(function(err) {
                                return caches.open(CACHE_STATIC_NAME)
                                    .then(function(cache) {
                                        if (event.request.headers.get('accept').includes('text/html')) {
                                            return cache.match('/offline.html');
                                        }
                                    })
                            });
                    }
                })
        );
    }
});
