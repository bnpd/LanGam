'use strict';
import config from '../../config.js';
import DocumentC from '../DocumentC.js'

// backend constants
/**
 * @param {string} user
 */
function EndpointGetVocab(user) {return '/vocab/'+user;}
/**
 * @param {string} user
 * @param {string} docId
 */
function EndpointGetTask(user, docId) {return `/task/${user}/${docId}`;}
/**
 * @param {string} user
 * @param {string} filter
 */
function EndpointGetTopTasks(user, filter) {return `/top_tasks/${user}?q=${filter}`;}
/**
 * @param {string} user
 */
function EndpointGetDueTask(user) {return `/due_task/${user}`;}


// backend endpoints
/**
 * @param {string} user
 */
export async function getVocab(user){
	return new Promise((resolve, reject) => {
		backendGet(EndpointGetVocab(user), responseJson => {
			try { 
				resolve([responseJson['scheduled'], responseJson['all_forms']])
			} catch (error) {
				console.error(error)
				reject(error)
			}
		})		
	})
}

/**
 * @param {string} user
 * @param {string | null} docId
 */
export async function getTask(user, docId){
	return new Promise((resolve, reject) => {
		backendGet(docId ? EndpointGetTask(user, docId) : EndpointGetDueTask(user), responseJson => {
			try { 
				resolve(DocumentC.fromJson(responseJson))
			} catch (error) {
				console.error(error)
				reject(error)
			}
		})
	})
}

/**
 * @param {string} user
 * @param {any} query
 */
export async function getTopTasks(user, query){
	return new Promise((resolve, reject) => {
		backendGet(EndpointGetTopTasks(user, JSON.stringify(query)), responseJson => {
			try { 
				resolve(responseJson)
			} catch (error) {
				console.error(error)
				reject(error)
			}
		})
	})
}


// lowlevel backend communication
/**
 * @param {string} path
 * @param {{ (responseJson: any): void; }} onSuccess
 */
export function backendGet(path, onSuccess) {
	fetch(config.backend + path)
	.then(async response => {
	  if (!response.ok) {
		throw new Error('Get error.' + await response.text())
	  }
	  onSuccess(await response.json())
	})
}
/**
 * @param {string} path
 * @param {Object} payload
 */
export async function backendPost(path, payload) {
    const response = await fetch(config.backend + path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error('Post error: ' + await response.text());
    }

    return await response.json();
}

// Push Notifications
/**
 * @param {String} user
 */
export function requestNotifications(user) {
	return subscribeUserToPush().then(subscription => sendSubscriptionToBackEnd(subscription, user));
}
function subscribeUserToPush() {
	return navigator.serviceWorker.ready
		.then(registration => {
			const subscribeOptions = {
				userVisibleOnly: true,
				applicationServerKey: config.webpush_public_key,
			};
			return registration.pushManager.subscribe(subscribeOptions);
		})
		.then(pushSubscription => {
			console.log(
				'Received PushSubscription: ',
				JSON.stringify(pushSubscription)
			);
			return pushSubscription;
		});
}
/**
 * @param {PushSubscription} subscription
 * @param {string} username
 */
function sendSubscriptionToBackEnd(subscription, username) {
	return fetch(config.backend + '/api/webpush-subscribe/' + username, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(subscription),
	}).then(function (response) {
		if (!response.ok) {
			throw new Error('Server error.');
		}
		return true;
	});
}

