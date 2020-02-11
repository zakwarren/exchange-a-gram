# Exchange-a-gram

Share your photos with your friends on the line, but instantaneously,
with [Exchange-a-gram](https://exchange-a-gram-a9533.firebaseapp.com/).

![Exchange-a-gram homepage](/public/src/images/homepage-screenshot.png)

## How to Use
You need [Node.js](https://nodejs.org) installed on your machine.
Simply download the installer from [nodejs.org](https://nodejs.org)
and go through the installation steps.

Once Node.js is installed, open your command prompt or terminal
and **navigate into this project folder**. The you can install
the dependencies using:

```bash
npm install
```

Once all the dependencies are successfully installed, run:

```bash
npm start
```

Then you can visit [localhost:8080](http://localhost:8080) to
see the running application.

## Steps taken to build as a Progressive Web App

1. Create a manifest.json file
2. Register a Service Worker
3. Identify the AppShell (i.e. core assets your app requires to provide its basic "frame")
4. Precache the AppShell
5. Add code to fetch the precached assets from cache when needed
6. Precache other assets required to make the root index.html file work
7. Set up versioning and clean up of caches so new files get loaded and cached
8. Add dynamic caching (with versioning) to cache everything in your app when visited / fetched by the user
9. Add differential caching strategies for different routes
10. Add an event listener for the `beforeinstallprompt` event, then prompt user to install on gesture
11. Add polyfills for necessary features, e.g. promises and fetch
12. Save dynamic data in indexedDB
13. Store user submitted data in indexedDB and register a sync event
14. Run background sync tasks in service worker
15. Ask permission to enable notifications and configure them
16. Add an event listener in the service worker for push notifications
17. Ask permission to use user geolocation so user can easily add their location
18. Ask permission to use media devices so user can take photos
