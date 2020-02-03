
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
// const trimCache = (cacheName, maxItems) => {
//     caches.open(cacheName)
//         .then(cache => {
//             return cache.keys()
//                 .then(keys => {
//                     if (keys.length > maxItems) {
//                         cache.delete(keys[0])
//                             .then(trimCache(cacheName, maxItems));
//                     }
//                 });
//         });
// }

self.addEventListener('install', event => {
    console.log('[Service worker] Installing Service Worker...', event);
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME)
            .then(cache => {
                console.log('[Service worker] Pre-caching app shell');
                cache.addAll(STATIC_FILES);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('[Service worker] Activating Service Worker...', event);
    // trimCache(CACHE_DYNAMIC_NAME, CACHE_LIMIT);
    event.waitUntil(
        caches.keys()
            .then(keyList => {
                return Promise.all(keyList.map(key => {
                    if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                        console.log('[Service worker] Removing old cache:', key);
                        return caches.delete(key);
                    }
                }));
            })
    );
    return self.clients.claim();
});

const isInArray = (string, array) => {
    let cachePath;
    if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
        cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
    } else {
        cachePath = string; // store the full request (for CDNs)
    }
    return array.indexOf(cachePath) > -1;
  }

self.addEventListener('fetch', event => {
    if (event.request.url.indexOf(DATABASE_URL + 'posts.json') > -1) {
        // indexedDB for post requests
        // get data from network then store it in indexedDB
        // for faster recall and offline support
        event.respondWith(
            fetch(event.request)
                .then(res => {
                    const clonedRes = res.clone();
                    clearAllData('posts')
                        .then(() => {
                            return clonedRes.json();
                        })
                        .then(data => {
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
                .then(response => {
                    if (response) {
                        return response;
                    } else {
                        return fetch(event.request)
                            .then(res => {
                                return caches.open(CACHE_DYNAMIC_NAME)
                                    .then(cache => {
                                        // trimCache(CACHE_DYNAMIC_NAME, CACHE_LIMIT);
                                        cache.put(event.request.url, res.clone());
                                        return res;
                                    });
                            })
                            .catch(err => {
                                return caches.open(CACHE_STATIC_NAME)
                                    .then(cache => {
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

self.addEventListener('sync', event => {
    console.log('[Service Worker] Background syncing', event);
    const storeName = 'sync-posts';
    if (event.tag === 'sync-new-post') {
        console.log('[Service Worker] Syncing new posts');
        event.waitUntil(
            readAllData(storeName)
                .then(data => {
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
                        .then(res => {
                            if (res.ok) {
                                res.json()
                                    .then(resData => {
                                        deleteItemFromData(storeName, resData.id);
                                    })
                            }
                        })
                        .catch(err => {
                            console.error('Error while sending data', err);
                        })
                    }
                })
        );
    }
});

self.addEventListener('notificationclick', event => {
    var notification = event.notification;
    var action = event.action;

    console.log(notification);

    if (action === 'confirm') {
        console.log('Confirm was chosen');
    } else if (action === 'cancel') {
        console.log('Cancel was chosen');
    } else {
        console.log(action);
    }
    notification.close();
});

self.addEventListener('notificationclose', event => {
    console.log('Notification was closed', event);
});
