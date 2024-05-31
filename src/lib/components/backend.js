'use strict';
import config from '../../config.js';
import DocumentC from '../DocumentC.js'

// backend constants
function EndpointGetVocab(user) {return '/vocab/'+user;}
function EndpointGetTask(user, docId) {return `/task/${user}/${docId}`;}
function EndpointGetDueTask(user) {return `/due_task/${user}`;}


// backend endpoints
export async function getVocab(user){
	return new Promise((resolve, reject) => {
		backendGet(EndpointGetVocab(user), responseText => {
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

export async function getTask(user, docId){
	return new Promise((resolve, reject) => {
		backendGet(docId ? EndpointGetTask(user, docId) : EndpointGetDueTask(user), responseText => {
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
			error_handler_function(xhr.responseText)
		}
	}
	xhr.open("GET", config.backend + path, true)
	xhr.send(null)
}
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

