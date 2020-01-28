# Exchange-a-gram

Share your photos with your friends on the line, but instantaneously.

## How to Use
You need [Node.js](https://nodejs.org) installed on your machine.
Simply download the installer from [nodejs.org](https://nodejs.org)
and go through the installation steps.

Once Node.js is installed, open your command prompt or terminal
and **navigate into this project folder**. There, run `npm install`
to install all required dependencies.

Finally, run `npm start` to start the development server and
visit [localhost:8080](http://localhost:8080) to see the running
application.

## Steps taken to build as a Progressive Web App

1. Register a Service Worker
2. Identify the AppShell (i.e. core assets your app requires to provide its basic "frame")
3. Precache the AppShell
4. Add code to fetch the precached assets from cache when needed
5. Precache other assets required to make the root index.html file work
6. Set up versioning and clean up of caches so new files get loaded and cached
7. Add dynamic caching (with versioning) to cache everything in your app when visited / fetched by the user
