
importScripts('/src/js/constants.js');
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const CACHE_STATIC_NAME = 'static-v8';
const CACHE_DYNAMIC_NAME = 'dynamic-v8';
const STATIC_FILES = [
    '/',
    '/index.html',
    '/offline.html',
    '/src/js/app.js',
    '/src/js/feed.js',
    '/src/js/promise.js',
    '/src/js/fetch.js',
    '/src/js/constants.js',
    '/src/js/idb.js',
    '/src/js/utility.js',
    '/src/js/material.min.js',
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/images/main-image.jpg',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

// const CACHE_LIMIT = 10;
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
    let cachePath;
    if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
        cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
    } else {
        cachePath = string; // store the full request (for CDNs)
    }
    return array.indexOf(cachePath) > -1;
  }

self.addEventListener('fetch', function(event) {
    if (event.request.url.indexOf(DATABASE_URL) > -1) {
        // indexedDB for post requests
        // get data from network then store it in indexedDB
        // for faster recall and offline support
        event.respondWith(
            fetch(event.request)
                .then(function(res) {
                    const clonedRes = res.clone();
                    clearAllData('posts')
                        .then(function() {
                            return clonedRes.json();
                        })
                        .then(function(data) {
                            for (let key in data) {
                                writeData('posts', data[key]);
                            }
                        });
                    return res;
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

self.addEventListener('sync', function(event) {
    console.log('[Service Worker] Background syncing', event);
    const storeName = 'sync-posts';
    if (event.tag === 'sync-new-post') {
        console.log('[Service Worker] Syncing new posts');
        event.waitUntil(
            readAllData(storeName)
                .then(function(data) {
                    for (let dt of data) {
                        fetch(POST_URL, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify({
                                id: dt.id,
                                title: dt.title,
                                location: dt.location,
                                image: dt.image
                            })
                        })
                        .then(function(res) {
                            if (res.OK) {
                                res.json()
                                    .then(function(resData) {
                                        deleteItemFromData(storeName, resData.id);
                                    })
                            }
                        })
                        .catch(function(err) {
                            console.error('Error while sending data', err);
                        })
                    }
                })
        );
    }
});
