'use strict';

const CACHE_NAME = 'static-cache';

const FILES_TO_CACHE = [
  '/index.html',
  '/styles.css'
]

self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install');
  // Precache static resources
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page');
      return cache.addAll(FILES_TO_CACHE);
    })
  )

  self.skipWaiting();
})

self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate');
  // Remove previous cached data from disk
  self.clients.claim();
})

self.addEventListener('fetch', (evt) => {
  console.log('[ServiceWorker] Fetch', evt.request.url);
  // Fetch event handler here
  if (evt.request.mode !== 'navigate') {
    // Not a page navigation, bail.
    return;
  }
  evt.respondWith(
      fetch(evt.request) //get from the network with fetch, if no network then catch uses the cache
          .catch(() => {
            return caches.open(CACHE_NAME)
                .then((cache) => {
                  return cache.match('index.html');
                });
          })
  )
})
