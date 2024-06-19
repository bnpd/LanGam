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
/**
 * @param {string} user
 * @param {string} chatPrompt
 * @param {string | undefined} docId
 */
function EndpointChat(user, chatPrompt, docId) {return `/chat/${user}?q=${chatPrompt}` + (docId ? `&docId=${docId}` : '');}


// backend endpoints
/**
 * @param {string} user
 */
export async function getVocab(user){
	try { 
		const responseJson = await backendGet(EndpointGetVocab(user))
		return [responseJson['scheduled'], responseJson['all_forms']]
	} catch (error) {
		console.error(error)
		return Promise.reject(error)
	}
}

/**
 * @param {string} user
 * @param {string | null} [docId]
 */
export async function getTask(user, docId){
	try { 
		const responseJson = await backendGet(docId ? EndpointGetTask(user, docId) : EndpointGetDueTask(user)) 
		return DocumentC.fromJson(responseJson)
	} catch (error) {
		console.error(error)
		return Promise.reject(error)
	}
}

/**
 * @param {string} user
 * @param {any} query
 */
export async function getTopTasks(user, query){
	return backendGet(EndpointGetTopTasks(user, JSON.stringify(query)))
}

/** Check whether a task is available. SHOULD ONLY BE USED WHEN OFFLINE.
 * @param {string} user
 * @param {string} docId
 */
export async function isTaskCached(user, docId){
	try {
		let res = await fetch(
			config.backend + EndpointGetTask(user, docId),
			{method:'Head',cache:'force-cache'}
		);
		return true
	} catch (_) {
		console.log(_);
		return false
	}
}
    

/**
 * @param {string} user
 * @param {string} chatPrompt
 * @param {string | undefined} docId
 */
export async function sendChat(user, chatPrompt, docId) {
	return (await backendGet(EndpointChat(user, chatPrompt, docId))).response
}


// lowlevel backend communication
/**
 * @param {string} path
 */
export async function backendGet(path) {
	const response = await fetch(config.backend + path)
	if (!response.ok) {
		throw new Error('Get error.' + await response.text())
	}
	return await response.json()
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

