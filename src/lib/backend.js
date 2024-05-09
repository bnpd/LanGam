'use strict';
import config from '../config.js';

// backend constants
function EndpointGetVocab(user) {return '/vocab/'+user;}


// backend endpoints
export async function getVocab(user){
	return new Promise((resolve, reject) => {
		backendGet(EndpointGetVocab(user), responseText => {
			let doc = null
			try { 
				let json = JSON.parse(responseText)
				console.log(JSON.parse(json['scheduled']));
				console.log(JSON.parse(json['all_forms']));
				resolve([JSON.parse(json['scheduled']), JSON.parse(json['all_forms'])])
			} catch (error) {
				console.error(error)
				reject(error)
			}
		}, console.error)		
	})
}


// lowlevel backend communication
export function backendGet(path, callback, error_handler_function) {
	var xhr = new XMLHttpRequest()
	xhr.onreadystatechange = function xhrHandler() {
		if (xhr.readyState != 4) {
			return
		}
		if (xhr.status == 200) {
			callback(xhr.responseText)
		} else if (xhr.responseText.includes('User does not exist')) {
			error_handler_function('Sorry, user seems not to exist 😶‍🌫')
		} else {
			error_handler_function('Sorry, there is a network communications problem 🗣️🙉\nTry again in a sec')
		}
	}
	xhr.open("GET", config.backend + path, true)
	xhr.send(null)
}
export function backendPost(path, payload, callback) {
	return fetch(config.backend + path, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: payload,
	}).then(function (response) {
		if (!response.ok) {
			throw new Error('Post error.' + response.text)
		}
		callback()
	})
}

// Push Notifications
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

