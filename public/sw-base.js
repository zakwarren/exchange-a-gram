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

workboxSW.precache([]);

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
