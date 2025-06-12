// sw.js

const CACHE_NAME = 'drug-search-cache-v1'; // Change version to update cache
const urlsToCache = [
    './', // Alias for index.html if start_url is '/' or './'
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    // Add paths to your icons (if not already covered by a general image caching strategy)
    './images/icons/icon-72x72.png',
    './images/icons/icon-128x128.png',
    './images/icons/icon-144x144.png',
    './images/icons/icon-152x152.png',
    './images/icons/icon-192x192.png',
    './images/icons/icon-388x388.png',
    './images/icons/icon-512x512.png',
    // Add other essential static assets like your placeholder SVG if it's a file
    // 'data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'%3E%3Crect width=\\'100\\' height=\\'100\\' fill=\\'%23e0e0e0\\'/%3E%3Ctext x=\\'50\\' y=\\'60\\' font-size=\\'40\\' text-anchor=\\'middle\\' fill=\\'%23999\\'%3E?%3C/text%3E%3C/svg%3E', // Data URIs are already "cached"
    // Font Awesome and Vazirmatn font (if you want to cache them from CDNs)
    'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
    // Note: Caching external resources like CDN fonts can be tricky due to CORS and update strategies.
    // For fonts, it's often better to let the browser cache them, or use a more advanced strategy.
    // For now, let's focus on local assets.
];

// Install event:
// This event is fired when the service worker is first installed.
// We open a cache and add our core assets to it.
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache:', CACHE_NAME);
                return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'}))); // Force reload from network for initial cache
            })
            .catch(function(error) {
                console.error('Failed to cache resources during install:', error);
            })
    );
});

// Activate event:
// This event is fired after installation, when the service worker becomes active.
// It's a good place to clean up old caches.
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim(); // Take control of uncontrolled clients
});

// Fetch event:
// This event is fired for every network request made by the page.
// We try to serve assets from the cache first. If not found, fetch from network.
self.addEventListener('fetch', function(event) {
    // We only want to cache GET requests for app shell resources.
    // API calls (like to irc.fda.gov.ir) should typically go to the network.
    if (event.request.method !== 'GET' || event.request.url.includes('irc.fda.gov.ir')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Not in cache, fetch from network
                // IMPORTANT: Clone the request. A request is a stream and
                // can only be consumed once. Since we are consuming this
                // once by cache and once by the browser for fetch, we need
                // to clone the response.
                let fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    function(response) {
                        // Check if we received a valid response
                        if(!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
                            return response; // Don't cache invalid responses or opaque responses unless intended
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        let responseToCache = response.clone();

                        // Only cache local assets or explicitly whitelisted CDNs here
                        // Be careful caching everything, especially third-party scripts/styles that might update.
                        if (urlsToCache.includes(event.request.url) || 
                            (event.request.url.startsWith(self.location.origin) && !event.request.url.includes('sw.js'))) { // Cache same-origin resources, excluding sw.js itself
                            caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            })
                            .catch(function(err){
                                console.error("SW: Error caching new resource", event.request.url, err);
                            });
                        }
                        return response;
                    }
                ).catch(function(error) {
                    console.error('SW: Fetch failed; returning offline page instead.', error);
                    // Optionally, return a generic offline fallback page:
                    // return caches.match('./offline.html'); // You'd need to create and cache offline.html
                    // For now, just let it fail naturally if network is down and not in cache
                });
            })
        );
});