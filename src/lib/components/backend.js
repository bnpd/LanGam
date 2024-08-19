'use strict';
import { goto } from '$app/navigation';
import config from '../../config.js';
import DocumentC from '../DocumentC.js'
import PocketBase from 'pocketbase';

// PocketBase
const pb = new PocketBase(config.pocketbase)
const MAX_CHAT_HISTORY_LENGTH = 20
const MAX_CHAT_HISTORY_CHARS = 20000

/**
 * @param {string} user
 * @param {string} password
 */
export async function login(user, password) {
	return pb.collection('users').authWithPassword(user, password);
}

/**
 * @param {string} langId id of the language in pocketbase
 */
export async function getLangById(langId) {
	return pb.collection('langs').getOne(langId);
}

export function getUserData() {
	return pb.authStore?.model
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
function EndpointGetTask(targetLang, docId) {return `/task/${targetLang}/${docId}`;}
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
/**
 * @param {string} targetLang
 * @param {string} docId
 */
function EndpointGetUserTaskStats(targetLang, docId) {return `/user_task_stats/${targetLang}/${docId}`;}
/**
 * @param {string} targetLang
 */
function EndpointReview(targetLang) {return `/review/${targetLang}`;}
/**
 * EITHER docId+targetLang+isInline or contextParagraphs should be specified, if both are present, contextParagraphs will be prioritized. Inline needs both docId & targetLang
 * @param {string} chatHistoryString
 * @param {boolean} isInline
 * @param {string | undefined} targetLang
 * @param {string | undefined} docId
 * @param {string | undefined} contextParagraphs
 */
function EndpointChat(chatHistoryString, isInline, targetLang=undefined, docId=undefined, contextParagraphs=undefined) {
	return `/chat?hist=${encodeURIComponent(chatHistoryString)}` + (contextParagraphs ? `&ctx=${contextParagraphs}` : docId && targetLang ? `&docId=${docId}&targetLang=${targetLang}`+(isInline ? '&inline=true' : '') : '');
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
		const responseJson = await backendGet(docId ? EndpointGetTask(targetLang, docId) : EndpointGetDueTask(targetLang)) 
		return DocumentC.fromJson(responseJson)
	} catch (error) {
		console.error(error)
		return Promise.reject(error)
	}
}

/**
 * @param {string} targetLang
 * @param {string} docId
 * @returns {Promise<[string[], string[]]>}
 */
export async function getUserTaskStats(targetLang, docId){
	try { 
		const responseJson = await backendGet(await EndpointGetUserTaskStats(targetLang, docId))
		return [responseJson['sr_words'], responseJson['new_forms']]
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
	return backendGet(EndpointGetTopTasks(targetLang, JSON.stringify(query)), false)
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
		return false
	}
}
    

/**
 * EITHER docId or contextParagraphs should be specified, if both are present, contextParagraphs will be prioritized.
 * @param {{role: string;content: string;}[]} chatHistory
 * @param {boolean} isInline
 * @param {string | undefined} targetLang
 * @param {string | undefined} docId
 * @param {string | undefined} contextParagraphs
 * @returns {Promise<{correction: DocumentC | undefined, response: DocumentC}>} This document will have only the key text.text defined unless docId and targetLang were given as inputs //TODO: add a parameter inline to this function and the backend endpoint instead of this assumption
 */
export async function sendChat(chatHistory, isInline, targetLang=undefined, docId=undefined, contextParagraphs=undefined) {
	const chatHistoryText = JSON.stringify(chatHistory.slice(-MAX_CHAT_HISTORY_LENGTH))
	if (chatHistoryText.length > MAX_CHAT_HISTORY_CHARS) {
		throw new Error("Chat history too long.");		
	}
	let {correction, response} = await backendGet(EndpointChat(chatHistoryText, isInline, targetLang, docId, contextParagraphs))
	return {correction: correction ? DocumentC.fromJson(correction) : undefined, response: DocumentC.fromJson(response)}
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
		if (response.status == 401) {
			goto('/login')
			return Promise.reject('Invalid auth.')
		}
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
		if (response.status == 401) {
			goto('/login')
			return Promise.reject('Invalid auth.')
		}
        throw new Error('Post error: ' + await response.text());
    }
    return await response.json();
}

// Feedback
/**
 * @param {string} text
 * @param {string | undefined} email
 */
export async function sendFeedback(text, email) {	
	return pb.collection('feedback').create({text: text, email: email});
}

// Push Notifications
export function requestNotifications() {
	return subscribeUserToPush().then(subscription => backendPost('/api/webpush-subscribe', subscription, true));
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
			return pushSubscription;
		});
}

