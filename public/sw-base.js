importScripts('workbox-sw.prod.v2.1.3.js');
importScripts('/src/js/constants.js');
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(
    DATABASE_URL + 'posts.json',
    args => {
        return fetch(args.event.request)
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
    }
);

workboxSW.router.registerRoute(
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
    workboxSW.strategies.staleWhileRevalidate({
        cacheName: 'material-css'
    })
);

workboxSW.router.registerRoute(
    /.*(?:firebasestorage\.googleapis)\.com.*$/,
    workboxSW.strategies.staleWhileRevalidate({
        cacheName: 'post-images'
    })
);

workboxSW.router.registerRoute(
    /.*(?:googleapis|gstatic)\.com.*$/,
    workboxSW.strategies.staleWhileRevalidate({
        cacheName: 'google-fonts',
        cacheExpiration: {
            maxEntries: 3,
            maxAgeSeconds: 60 * 60 * 24 * 30 // every month
        }
    })
);

workboxSW.router.registerRoute(
    routeData => {
        return (routeData.event.request.headers.get('accept').includes('text/html'));
    },
    args => {
        return caches.match(args.event.request)
            .then(response => {
                if (response) {
                    return response;
                } else {
                    return fetch(args.event.request)
                        .then(res => {
                            return caches.open('dynamic')
                                .then(cache => {
                                    cache.put(args.event.request.url, res.clone());
                                    return res;
                                });
                        })
                        .catch(() => {
                            return caches.match('/offline.html')
                                .then(res => {
                                    return res;
                                });
                        });
                }
            })
    }
);

workboxSW.precache([]);
