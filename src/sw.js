'use strict'

const CACHE_NAME = 'static-cache'

const FILES_TO_CACHE = [
  '/index.html',
  '/styles.css'
]

self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install')
  // Precache static resources
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page')
      return cache.addAll(FILES_TO_CACHE)
    })
  )

  self.skipWaiting()
})

self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate')
  // Remove previous cached data from disk
  self.clients.claim()
})

self.addEventListener('fetch', (evt) => {
  console.log('[ServiceWorker] Fetch', evt.request.url)
  // Fetch event handler here
  if (evt.request.mode !== 'navigate') {
    // Not a page navigation, bail.
    return
  }
  evt.respondWith(
      fetch(evt.request) //get from the network with fetch, if no network then catch uses the cache
          .catch(() => {
            return caches.open(CACHE_NAME)
                .then((cache) => {
                  return cache.match('offline.html')
                })
          })
  )
})

self.addEventListener('push', evt => {
    if (evt.data) {
        console.log('This push event has data: ', evt.data.json())
        self.registration.showNotification(
            evt.data.json().title, {
                body: evt.data.json().body,
                icon: 'images/icons/icon-192x192.png',
                badge: 'images/icons/icon-64x64.png'
            }
        )
    }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
//   event.waitUntil(clients.matchAll({
    //     type: "window",
    //     includeUncontrolled: true
    // }).then(function (clientList) {
    //     if (data.WebUrl) {
    //         let client = null;
    //
    //         for (let i = 0; i < clientList.length; i++) {
    //             let item = clientList[i];
    //
    //             if (item.url) {
    //                 client = item;
    //                 break;
    //             }
    //         }
    //
    //         if (client && 'navigate' in client) {
    //             client.focus();
    //             event.notification.close();
    //             return client.navigate(data.WebUrl);
    //         }
    //         else {
    //             event.notification.close();
    //             // if client doesn't have navigate function, try to open a new browser window
    //             return clients.openWindow(data.WebUrl);
    //         }
    //     }
    // }))
  clients.focus()
})


