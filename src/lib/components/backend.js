'use strict';
import { goto } from '$app/navigation';
import config from '../../config.js';
import DocumentC from '../DocumentC.js'
import PocketBase from 'pocketbase';

// PocketBase
const url = 'https://allai.pockethost.io/'
const pb = new PocketBase(url)

/**
 * @param {string} user
 * @param {string} password
 */
export async function login(user, password) {
	return pb.collection('users').authWithPassword(user, password);
}


// backend endpoint constants
const ENDPOINT_SIGNUP = '/signup'
const ENDPOINT_NEW_USER_LANG = '/new_user_lang'
/**
 * @param {string} targetLang
 */
function EndpointGetVocab(targetLang) {return '/vocab/'+targetLang;}
/**
 * @param {string} targetLang
 * @param {string} docId
 */
async function EndpointGetTask(targetLang, docId) {return `/task/${targetLang}/${docId}`;}
/**
 * @param {string} targetLang
 * @param {string} filter
 */
function EndpointGetTopTasks(targetLang, filter) {return `/top_tasks/${targetLang}?q=${filter}`;}
/**
 * @param {string} targetLang
 */
function EndpointGetDueTask(targetLang) {return `/due_task/${targetLang}`;}
/**
 * @param {string} targetLang
 */
function EndpointReview(targetLang) {return `/review/${targetLang}`;}
/** EITHER docId+targetLang or contextParagraphs should be specified, if both are present, contextParagraphs will be prioritized.
 * @param {string} chatPrompt
 * @param {string | undefined} targetLang
 * @param {string | undefined} docId
 * @param {string | undefined} contextParagraphs
 */
function EndpointChat(chatPrompt, targetLang=undefined, docId=undefined, contextParagraphs=undefined) {
	return `/chat?q=${chatPrompt}` + (contextParagraphs ? `&ctx=${contextParagraphs}` : docId && targetLang ? `&docId=${docId}&targetLang=${targetLang}` : '');
}


// backend functions
/**
 * @param {string} email
 * @param {string} password
 * @param {string} native_lang
 */
export async function signup(email, password, native_lang) {
	return backendPost(ENDPOINT_SIGNUP, {email: email, password: password, native_lang: native_lang}, false)
}


/**
 * @param {string} targetLang
 */
export async function newUserLang(targetLang) {
	return backendPost(ENDPOINT_NEW_USER_LANG, {target_lang: targetLang}, true)
}


/**
 * @param {string} targetLang
 * @param {string} docId
 * @param {string[]} failedTokens
 */
export async function sendReview(targetLang, docId, failedTokens) {
	const json = {docId: docId, failedTokens: failedTokens}
	return backendPost(EndpointReview(targetLang), json)
}

  

/**
 * @param {string} targetLang
 */
export async function getVocab(targetLang){
	try { 
		const responseJson = await backendGet(EndpointGetVocab(targetLang))
		return [responseJson['scheduled'], responseJson['all_forms']]
	} catch (error) {
		console.error(error)
		return Promise.reject(error)
	}
}

/**
 * @param {string} targetLang
 * @param {string | null} [docId]
 */
export async function getTask(targetLang, docId){
	try { 
		const responseJson = await backendGet(docId ? await EndpointGetTask(targetLang, docId) : EndpointGetDueTask(targetLang)) 
		return DocumentC.fromJson(responseJson)
	} catch (error) {
		console.error(error)
		return Promise.reject(error)
	}
}

/**
 * @param {string} targetLang
 * @param {any} query
 */
export async function getTopTasks(targetLang, query){
	return backendGet(EndpointGetTopTasks(targetLang, JSON.stringify(query)))
}

/** Check whether a task is available. SHOULD ONLY BE USED WHEN OFFLINE.
 * @param {string} targetLang
 * @param {string} docId
 */
export async function isTaskCached(targetLang, docId){
	try {
		let res = await fetch(
			config.backend + EndpointGetTask(targetLang, docId),
			{method:'Head',cache:'force-cache'}
		);
		return true
	} catch (_) {
		console.log(_);
		return false
	}
}
    

/** EITHER docId or contextParagraphs should be specified, if both are present, contextParagraphs will be prioritized.
 * @param {string} chatPrompt
 * @param {string | undefined} targetLang
 * @param {string | undefined} docId
 * @param {string | undefined} contextParagraphs
 */
export async function sendChat(chatPrompt, targetLang=undefined, docId=undefined, contextParagraphs=undefined) {
	return (await backendGet(EndpointChat(chatPrompt, targetLang, docId, contextParagraphs))).response
}


// lowlevel backend communication
/**
 * @param {string} path
 * @param {boolean} [authRequired] whether this endpoint requires authorization token
 */
export async function backendGet(path, authRequired=true) {
	if (authRequired && !pb.authStore.isValid) {
		goto('/login')
		return Promise.reject('Not logged in.')
	}
	const response = await fetch(config.backend + path, authRequired ? {headers: {Authorization: `Bearer ${pb.authStore.token}`}} : undefined)
	if (!response.ok) {
		throw new Error('Get error.' + await response.text())
	}
	return await response.json()
}


/**
 * @param {string} path
 * @param {Object} payload
 * @param {boolean} [authRequired] whether this endpoint requires authorization token
 */
export async function backendPost(path, payload, authRequired=true) {
	if (authRequired && !pb.authStore.isValid) {
		goto('/login')
		return Promise.reject('Not logged in.')
	}
    const response = await fetch(config.backend + path, {
        method: 'POST',
        headers: authRequired ? {
			Authorization: `Bearer ${pb.authStore.token}`,
            'Content-Type': 'application/json',
        } : {
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

