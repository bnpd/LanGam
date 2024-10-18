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
 * Specify EITHER: 
 * isInline=true + docId+targetLang or
 * isInline=false + (docId+targetLang OR contextParagraphs)
 * @param {string} chatHistoryString
 * @param {boolean} isInline
 * @param {string | undefined} targetLang
 * @param {string | undefined} docId
 * @param {string | undefined} contextParagraphs
 */
function EndpointChat(chatHistoryString, isInline, targetLang=undefined, docId=undefined, contextParagraphs=undefined) {
	if (isInline && !(docId && targetLang)) throw 'EndpointChat: Incompatible parameters: isInline without docId+targetLang'
	if (docId && targetLang && contextParagraphs) throw 'EndpointChat: Incompatible parameters: docId+targetLang+contextParagraphs'
	return isInline ? `/chat_tandem?hist=${encodeURIComponent(chatHistoryString)}` + (`&docId=${docId}&targetLang=${targetLang}`)
					: `/chat_tutor?hist=${encodeURIComponent(chatHistoryString)}` + (contextParagraphs ? `&ctx=${encodeURIComponent(contextParagraphs)}` : docId && targetLang ? `&docId=${docId}&targetLang=${targetLang}` : '');;
}

/**
 * @param {string} chatHistoryText
 * @param {string} contextParagraphs
 */
function EndpointTutorChat(chatHistoryText, contextParagraphs) {
	return `/chat_tutor?hist=${encodeURIComponent(chatHistoryText)}&ctx=${contextParagraphs}`
}

/**
 * @param {string} chatHistoryString
 * @param {number} levelSeqId
 * @param {string} playerId
 */
function EndpointGameChat(chatHistoryString, playerId, levelSeqId) {
	return `/chat_game?hist=${encodeURIComponent(chatHistoryString)}&playerId=${playerId}&seqId=${levelSeqId}`
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
 * @param {string} targetLangShortcode
 * @returns Promise<{targetLang: any, lang: any}>
 */
export async function newUserLang(targetLangShortcode) {
	return pb.send(`/new_user_lang`, {method: 'POST', body: {
            'langShortcode': targetLangShortcode
        }})
	//return backendPost(ENDPOINT_NEW_USER_LANG, {target_lang: targetLang}, true)
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
 * @param {string} user
 * @param {string} targetLangId
 */
export async function getUserLang(user, targetLangId){
	return pb.collection('user_langs').getFirstListItem(`user = "${user}" && target_lang = "${targetLangId}"`)
}

/**
 * @param {string} shortcode
 */
export async function getLang(shortcode){
	return pb.collection('langs').getFirstListItem(`shortcode = "${shortcode.toUpperCase()}"`)
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
		//const responseJson = await backendGet(await EndpointGetUserTaskStats(targetLang, docId))
		return [[], []]// [responseJson['sr_words'], responseJson['new_forms']]
	} catch (error) {
		console.error(error)
		return Promise.reject(error)
	}
}

/**
 * @param {string} targetLang
 * @param {any} query
 * @returns {Promise<any[][]>}
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
		await fetch(
			config.backend + EndpointGetTask(targetLang, docId),
			{method: 'Head', cache:'force-cache'}
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
	let {correction_of_learner_message, response} = await backendGet(EndpointChat(chatHistoryText, isInline, targetLang, docId, contextParagraphs))
	return {correction: correction_of_learner_message ? DocumentC.fromJson(correction_of_learner_message) : undefined, response: DocumentC.fromJson(response)}
}
    

/**
 * Versatile chat, envisioned to be used in the user's native language to ask the tutor about a confusion
 * @param {{role: string;content: string;}[]} chatHistory
 * @param {string} contextParagraphs
 * @returns {Promise<DocumentC>} This document will have only the key text.text defined unless docId and targetLang were given as inputs
 */
export async function sendTutorChat(chatHistory, contextParagraphs) {
	const chatHistoryText = JSON.stringify(chatHistory.slice(-MAX_CHAT_HISTORY_LENGTH))
	if (chatHistoryText.length > MAX_CHAT_HISTORY_CHARS) {
		throw new Error("Chat history too long.");		
	}
	let {response} = await pb.send(EndpointTutorChat(chatHistoryText, contextParagraphs), {})
	return DocumentC.fromJson(response)
}

// /**
//  * @param {string} gameId
//  * @param {string} seqId
//  */
// export async function getLevel(gameId, seqId) {
// 	return pb.collection('levels').getFirstListItem(`game="${gameId}" && seq_id=${seqId}`)
// }

/**
 * @param {string} playerId
 */
export async function getPlayerLevel(playerId) {	
	return pb.send(`/player_level/${playerId}`, {})
}

/**
 * @param {string} playerId
 * @param {number} seqId
 * @param {string} outcome
 * @returns {Promise<any>} The updated player
 */
export async function completeLevel(playerId, seqId, outcome) {
	return pb.send(`/complete_level`, {method: 'POST', body: {
		playerId: playerId, 
		seqId: seqId, 
		outcome: outcome
	}}).then(res => res.player)
}

/**
 * List all available games
 * @param {string} langId
 * @returns {Promise<any[]>}
 */
export async function getGames(langId) {
	return pb.collection('games').getFullList({filter: `lang = "${langId}"`})
}

/**
 * Get current user's player for the specified game
 * @param {string} gameId
 */
export async function getPlayer(gameId) {
	return pb.send(`/user_player/${gameId}`, {})
}

/**
 * Fetch the current player from the backend
 * @param {string} playerId
 */
export async function refreshPlayer(playerId) {
	return pb.collection('players').getFirstListItem(`id = "${playerId}"`)
}

/**
 * Update the current player in the backend
 * @param {any} player
 */
export async function updatePlayer(player) {
	return pb.collection('players').update(player.id, player)
}
    

/**
 * Send chat in game mode
 * @param {{role: string;content: string;}[]} chatHistory
 * @param {string} playerId
 * @param {Number} levelSeqId
 * @returns {Promise<{end_conversation: boolean;outcome: string;correction: DocumentC | undefined;response: DocumentC;}>} This document will have only the key text.text defined unless docId and targetLang were given as inputs //TODO: add a parameter inline to this function and the backend endpoint instead of this assumption
 */
export async function sendGameChat(chatHistory, playerId, levelSeqId) {
	const chatHistoryText = JSON.stringify(chatHistory.slice(-MAX_CHAT_HISTORY_LENGTH))
	if (chatHistoryText.length > MAX_CHAT_HISTORY_CHARS) {
		throw new Error("Chat history too long.");		
	}
	let {correction_of_learner_message, response, end_conversation, outcome} = await pb.send(EndpointGameChat(chatHistoryText, playerId, levelSeqId), {})
	return {end_conversation: end_conversation, outcome: outcome, correction: correction_of_learner_message ? DocumentC.fromJson(correction_of_learner_message) : undefined, response: DocumentC.fromJson(response)}
}


// lowlevel python backend communication
/**
 * @param {string} path
 * @param {boolean} [authRequired] whether this endpoint requires authorization token
 */
export async function backendGet(path, authRequired=true) {
	if (authRequired && !pb.authStore.isValid) {
		goto('/login')
		return Promise.reject('Not logged in.')
	}
	const response = await fetch(config.backend + path, authRequired ? {headers: {Authorization: `Bearer ${pb.authStore.token}`}, cache: navigator.onLine ? 'default' : 'force-cache'} : undefined)
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

