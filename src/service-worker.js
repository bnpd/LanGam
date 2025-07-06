/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';


// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
	...build, // the app itself
	...files  // everything in `static`
];

self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'CACHE_STATIC_ASSETS') {
		// Get cache for this app version and add files to it if not already there
		async function addMissingFilesToCache() {
			const cache = await caches.open(CACHE);

			// Check each asset in ASSETS and add it to cache if it's not already present
			for (const asset of ASSETS) {
				const response = await cache.match(asset);
				if (!response) {
					try {
						await cache.add(asset);
					} catch (err) {
						console.error(`Failed to cache ${asset}:`, err);
					}
				}
			}
		}
		event.waitUntil(addMissingFilesToCache());
	}
});

self.addEventListener('activate', (event) => {
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	// ignore POST requests etc
	if (
		event.request.method !== 'GET'
		|| url.origin === PUBLIC_POCKETBASE_URL
	) return;

	async function respond() {
		const cache = await caches.open(CACHE);

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(url.pathname);

			if (response) {
				return response;
			}
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			const response = await fetch(event.request);

			// if we're offline, fetch can return a value that is not a Response
			// instead of throwing - and we can't pass this non-Response to respondWith
			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch');
			}

			if (response.status === 200) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch (err) {
			const response = await cache.match(event.request);

			if (response) {
				return response;
			}

			// if there's no cache, then just show offline page
			// as there is nothing we can do to respond to this request
			return await cache.match('/offline.html')
		}
	}

	event.respondWith(respond());
});


/* ======= Web Push Events ======= */

self.addEventListener('push', evt => {
    if (evt.data) {
		if (evt.data.json().title == 'AllAi Exception') {
			const prevErrors = JSON.parse(localStorage.getItem('errors'))
			localStorage.setItem(
				'errors', 
				JSON.stringify([evt.data.json().body].concat(prevErrors ?? []))
			)
		}
        self.registration.showNotification(
            evt.data.json().title, {
                body: evt.data.json().body,
                icon: 'images/icons/icon-192x192.png',
                badge: 'images/icons/icon-64x64.png'
            }
        )
    }
})

self.addEventListener('notificationclick', evt => {
	if (evt.notification.title == 'AllAi Exception') {
		clients.openWindow(config["frontend"]+'/errors')
	}
    evt.notification.close()
    clients.openWindow(config["frontend"])
    clients.focus()
})


