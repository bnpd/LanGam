/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';
import config from './config.js';


// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
	...build, // the app itself
	...files  // everything in `static`
];

self.addEventListener('install', (event) => {
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
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
		|| url.origin === config.backend
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
        self.registration.showNotification(
            evt.data.json().title, {
                body: evt.data.json().body,
                icon: 'images/icons/icon-192x192.png',
                badge: 'images/icons/icon-64x64.png'
            }
        )
    }
})

self.addEventListener('notificationclick', event => {
    event.notification.close()
    clients.openWindow('https://allai-frontend-1.onrender.com')
    clients.focus()
})


