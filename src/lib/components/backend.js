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
 */
function EndpointGetDueTask(user) {return `/due_task/${user}`;}


// backend endpoints
/**
 * @param {string} user
 */
export async function getVocab(user){
	return new Promise((resolve, reject) => {
		backendGet(EndpointGetVocab(user), (/** @type {string} */ responseText) => {
			let doc = null
			try { 
				let json = JSON.parse(responseText)
				resolve([json['scheduled'], json['all_forms']])
			} catch (error) {
				console.error(error)
				reject(error)
			}
		}, console.error)		
	})
}

/**
 * @param {string} user
 * @param {string | null} docId
 */
export async function getTask(user, docId){
	return new Promise((resolve, reject) => {
		backendGet(docId ? EndpointGetTask(user, docId) : EndpointGetDueTask(user), (/** @type {string} */ responseText) => {
			let doc = null
			try { 
				let json = JSON.parse(responseText)
				console.log(json);
				resolve(DocumentC.fromJson(json))
			} catch (error) {
				console.error(error)
				reject(error)
			}
		}, reject)
	})
}


// lowlevel backend communication
/**
 * @param {string} path
 * @param {{ (responseText: string): void; }} callback
 * @param {{ (...data: any[]): void; }} error_handler_function
 */
export function backendGet(path, callback, error_handler_function) {
	fetch(config.backend + path)
	.then(async response => {
	  if (!response.ok) {
		const text = await response.text();
		if (text.includes('User does not exist')) {
			error_handler_function('Sorry, user seems not to exist 😶‍🌫');
		} else {
			error_handler_function(text);
		}
	  }
	  return response.text();
	})
	.then(data => {
	  callback(data);
	})
	.catch(error => {
	  error_handler_function(error.message);
	});
}
/**
 * @param {string} path
 * @param {Object} payload
 * @param {(arg0: Response) => void} onSuccess
 */
export function backendPost(path, payload, onSuccess) {
	return fetch(config.backend + path, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	}).then(function (response) {
		if (!response.ok) {
			throw new Error('Post error.' + response.text())
		}
		onSuccess(response)
	})
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

