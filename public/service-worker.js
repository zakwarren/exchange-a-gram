importScripts('workbox-sw.prod.v2.1.3.js');

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(
    /.*(?:googleapis|gstatic)\.com.*$/,
    workboxSW.strategies.staleWhileRevalidate({
        cacheName: 'google-fonts'
    })
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
