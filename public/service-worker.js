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
            maxEntries: 10,
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

workboxSW.precache([
  {
    "url": "404.html",
    "revision": "7f12f75f31877bf58459dbd43c7029dd"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "f68455f473ffd1dd3035c2e6fea99c21"
  },
  {
    "url": "manifest.json",
    "revision": "04cea0cbe418f77926486d4e80368c10"
  },
  {
    "url": "offline.html",
    "revision": "365cfb8e6c52a2402476337f2f5c5b76"
  },
  {
    "url": "src/css/app.css",
    "revision": "59d917c544c1928dd9a9e1099b0abd71"
  },
  {
    "url": "src/css/feed.css",
    "revision": "bfa4445f3db9d391440f3a2b20202a64"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "993fded2bbca804db343b5cdf8dcfc54"
  },
  {
    "url": "src/js/constants.js",
    "revision": "cebe29c824e4ac68e34166c3001f0a7f"
  },
  {
    "url": "src/js/feed.js",
    "revision": "8aed22151e536ded1f78d02f99399f01"
  },
  {
    "url": "src/js/fetch.js",
    "revision": "6b82fbb55ae19be4935964ae8c338e92"
  },
  {
    "url": "src/js/idb.js",
    "revision": "017ced36d82bea1e08b08393361e354d"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.js",
    "revision": "10c2238dcd105eb23f703ee53067417f"
  },
  {
    "url": "src/js/utility.js",
    "revision": "d50ef8d7ab415ff97a54b745db0378d7"
  },
  {
    "url": "sw.js",
    "revision": "930e242258357dc0d77446cf40fd534c"
  },
  {
    "url": "workbox-sw.prod.v2.1.3.js",
    "revision": "a9890beda9e5f17e4c68f42324217941"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "32f13b2f86d3342f94c04a09e8ee6d2f"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "1429de42428508a9973d1f1f7d9974d3"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "ba6dbc6710bc18c78818dffe78924b6e"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);

self.addEventListener('sync', event => {
    console.log('[Service Worker] Background syncing', event);
    const storeName = 'sync-posts';
    if (event.tag === 'sync-new-post') {
        console.log('[Service Worker] Syncing new posts');
        event.waitUntil(
            readAllData(storeName)
                .then(data => {
                    for (let dt of data) {
                        const postData = new FormData();
                        postData.append('id', dt.id);
                        postData.append('title', dt.title);
                        postData.append('location', dt.location);
                        postData.append('rawLocationLat', dt.rawLocation.lat);
                        postData.append('rawLocationLng', dt.rawLocation.lng);
                        postData.append('file', dt.picture, dt.id + '.png');

                        fetch(POST_URL, {
                            method: 'POST',
                            body: postData
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
    const notification = event.notification;
    const action = event.action;

    console.log(notification);

    if (action === 'cancel') {
        console.log('Cancel was chosen');
    } else {
        console.log(action + ' was chosen');
        event.waitUntil(
            clients.matchAll()
                .then(clis => {
                    const client = clis.find(c => {
                        return c.visibilityState === 'visible';
                    });
                    if (client !== undefined) {
                        client.navigate(notification.data.url);
                        client.focus();
                    } else {
                        clients.openWindow(notification.data.url);
                    }
                })
        );
    }
    notification.close();
});

self.addEventListener('notificationclose', event => {
    console.log('Notification was closed', event);
});

self.addEventListener('push', event => {
    console.log('Push notification received', event);

    let data = { title: 'New', content: 'Something new occurred', openUrl: '/' };
    if (event.data) {
        data = JSON.parse(event.data.text());
    }

    const options = {
        body: data.content,
        icon: '/src/images/icons/app-icon-96x96.png',
        badge: '/src/images/icons/app-icon-96x96.png',
        vibrate: [100, 50, 200],
        data: {
            url: data.openUrl
        }
    };
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});
