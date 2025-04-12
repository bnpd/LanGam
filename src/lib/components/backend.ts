'use strict';
import { goto } from '$app/navigation';
import { VocabCard } from '$lib/fsrs.js';
import config from '../../config.js';
import DocumentC from '../DocumentC.js'
import PocketBase, { type RecordModel } from 'pocketbase';

// PocketBase
const pb = new PocketBase(config.pocketbase)
const MAX_CHAT_HISTORY_LENGTH = 20
const MAX_CHAT_HISTORY_CHARS = 20000


/**
 * @param {string} user
 * @param {string} password
 */
export async function login(user: string, password: string) {
	return pb.collection('users').authWithPassword(user, password);
}


export async function loginWithGoogle(native_lang: string) {
	return pb.collection('users').authWithOAuth2({ provider: 'google', createData: {native_lang: native_lang} });
}


/**
 * @param {string} email
 * @param {string} password
 * @param {string} native_lang
 */
export async function signup(email: string, password: string, native_lang: string) {
	return pb.send('/signup', {method: 'POST', body: {email: email, password: password, native_lang: native_lang}})
}


/**
 * @param {string} targetLangShortcode
 * @returns Promise<{targetLang: any, lang: any}>
 */
export async function newUserLang(targetLangShortcode: string) {
	return pb.send(`/new_user_lang`, {method: 'POST', body: {
            'langShortcode': targetLangShortcode
        }})
	//return backendPost(ENDPOINT_NEW_USER_LANG, {target_lang: targetLang}, true)
}


/**
 * @param {string} langId id of the language in pocketbase
 */
export async function getLangById(langId: string) {
	return pb.collection('langs').getOne(langId);
}


export function getUserData() {
	return pb.authStore?.model
}


// backend endpoint constants
/**
 * @param {string} targetLang
 * @param {string} docId
 */
function EndpointGetTask(targetLang: string, docId: string) {return `/task/${targetLang}/${docId}`;}
/**
 * @param {string} targetLang
 * @param {string} filter
 */
function EndpointGetTopTasks(targetLang: string, filter: string) {return `/top_tasks/${targetLang}?q=${filter}`;}
/**
 * @param {string} targetLang
 */
function EndpointGetDueTask(targetLang: string) {return `/due_task/${targetLang}`;}
/**
 * @param {string} targetLang
 */
/**
 * @param {string} targetLang
 */
function EndpointReview(targetLang: string) {return `/review/${targetLang}`;}

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
function EndpointChat(chatHistoryString: string, isInline: boolean, targetLang: string | undefined=undefined, docId: string | undefined=undefined, contextParagraphs: string | undefined=undefined) {
	if (isInline && !(docId && targetLang)) throw 'EndpointChat: Incompatible parameters: isInline without docId+targetLang'
	if (docId && targetLang && contextParagraphs) throw 'EndpointChat: Incompatible parameters: docId+targetLang+contextParagraphs'
	return isInline ? `/chat_tandem?hist=${encodeURIComponent(chatHistoryString)}` + (`&docId=${docId}&targetLang=${targetLang}`)
					: `/chat_tutor?hist=${encodeURIComponent(chatHistoryString)}` + (contextParagraphs ? `&ctx=${encodeURIComponent(contextParagraphs)}` : docId && targetLang ? `&docId=${docId}&targetLang=${targetLang}` : '');;
}

/**
 * @param {string} chatHistoryText
 * @param {string} contextParagraphs
 */
function EndpointTutorChat(chatHistoryText: string, contextParagraphs: string) {
	return `/chat_tutor?hist=${encodeURIComponent(chatHistoryText)}&ctx=${contextParagraphs}`
}

/**
 * @param {string} chatHistoryString
 * @param {number} levelSeqId
 * @param {string} playerId
 */
function EndpointGameChat(chatHistoryString: string, playerId: string, levelSeqId: number) {
	return `/chat_game?hist=${encodeURIComponent(chatHistoryString)}&playerId=${playerId}&seqId=${levelSeqId}`
}


/**
 * @param {string} targetLang
 * @param {string} docId
 * @param {string[]} failedTokens
 */
export async function sendReview(targetLang: string, docId: string, failedTokens: string[]) {
	const json = {docId: docId, failedTokens: failedTokens}
	return backendPost(EndpointReview(targetLang), json)
}

  

/**
 * @param {string} user
 * @param {string} targetLangId
 */
export async function getUserLang(user: string, targetLangId: string){
	return pb.collection('user_langs').getFirstListItem(`user = "${user}" && target_lang = "${targetLangId}"`)
}

/**
 * @param {string} shortcode
 */
export async function getLang(shortcode: string){
	return pb.collection('langs').getFirstListItem(`shortcode = "${shortcode.toUpperCase()}"`)
}

/**
 * @param {string} targetLang
 * @param {string | null} [docId]
 */
export async function getTask(targetLang: string, docId: string | null){
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
export async function getUserTaskStats(targetLang: string, docId: string): Promise<[string[], string[]]>{
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
export async function getTopTasks(targetLang: string, query: any): Promise<any[][]>{
	return backendGet(EndpointGetTopTasks(targetLang, JSON.stringify(query)), false)
}

/** Check whether a task is available. SHOULD ONLY BE USED WHEN OFFLINE.
 * @param {string} targetLang
 * @param {string} docId
 */
export async function isTaskCached(targetLang: string, docId: string){
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
export async function sendChat(chatHistory: { role: string; content: string; }[], isInline: boolean, targetLang: string | undefined=undefined, docId: string | undefined=undefined, contextParagraphs: string | undefined=undefined): Promise<{ correction: DocumentC | undefined; response: DocumentC; }> {
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
export async function sendTutorChat(chatHistory: { role: string; content: string; }[], contextParagraphs: string): Promise<DocumentC> {
	const chatHistoryText = JSON.stringify(chatHistory.slice(-MAX_CHAT_HISTORY_LENGTH))
	if (chatHistoryText.length > MAX_CHAT_HISTORY_CHARS) {
		throw new Error("Chat history too long.");		
	}
	let {response} = await pb.send(EndpointTutorChat(chatHistoryText, contextParagraphs), {})
	return DocumentC.fromJson(response)
}

export async function getLevel(gameId: string, seqId: number, simplificationLevel?: string): Promise<RecordModel> {
	const level = await pb.collection('levels').getFirstListItem(`game="${gameId}" && seq_id=${seqId}`, {expand: ['grammar']})

	// move the desired simplification to default .text/title/question keys, unless simplificationLevel == ''
	if (simplificationLevel?.length && level.level[`text${simplificationLevel}`]?.text?.length) {
		level.level.title = level.level[`title${simplificationLevel}`]
		level.level.text = level.level[`text${simplificationLevel}`]
		level.level.question = level.level[`question${simplificationLevel}`]
	}
	console.log(level);
	
	return level
}

/**
 * @param {string} playerId
 */
export async function getPlayerLevel(playerId: string, simplificationLevel?: string): Promise<RecordModel> {	
	const level = await pb.send(`/player_level/${playerId}`, {})
	// move the desired simplification to default .text/title/question keys, unless simplificationLevel == ''
	if (simplificationLevel?.length && level.level[`text${simplificationLevel}`]?.text?.length) {
		level.level.title = level.level[`title${simplificationLevel}`]
		level.level.text = level.level[`text${simplificationLevel}`]
		level.level.question = level.level[`question${simplificationLevel}`]
	}
	console.log(level);
	
	return level
}

/**
 * @param {string} playerId
 * @param {number} seqId
 * @param {string} outcome
 * @returns {Promise<any>} The updated player
 */
export async function completeLevel(playerId: string, seqId: number, outcome: string): Promise<any> {
	return pb.send(`/complete_level`, {method: 'POST', body: {
		playerId: playerId, 
		seqId: seqId, 
		outcome: outcome
	}}).then(res => res.player)
}

/**
 * @param {string} langId
 * @param {{[x: string]: string | undefined}} cardJson
 * @param {boolean} reversed
 * @returns {Promise<any>} The new card
 */
export async function addSrWord(langId: string, cardJson: { [x: string]: string | undefined; }, reversed: boolean): Promise<any> {
	return pb.send(`/add_sr_word`, {method: 'POST', body: {
		langId,
		cardJson: JSON.stringify(cardJson),
		reversed
	}}).then(res => res.card)
}

/**
 * @param {string} langId
 * @returns {Promise<{[x: string]: string | undefined}[]>} The due cards
 */
export async function getDue(langId: string): Promise<VocabCard[]> {
	return pb.send(`/get_due?langId=${langId}`, {}).then(res => res.due?.map((jsonCard: any) => VocabCard.fromJson(jsonCard)))
}



/**
 * @param {VocabCard} card
 * @returns {Promise<any>} Promise when done
 */
export function updateSrCard(card: VocabCard): Promise<{ [x: string]: string | undefined; }[]> {
	if (!card.id) {
		throw new Error('Card must have id for update in pb')
	}
	let jsonCard: any = structuredClone(card)
	for (const [property, value] of Object.entries(jsonCard.card)) {
		jsonCard[property] = value
	}
	delete jsonCard.card	
	return pb.collection('sr_cards').update(jsonCard.id, jsonCard);
}

/**
 * @param {VocabCard} card
 * @returns {Promise<boolean>} Promise when done
 */
export function deleteSrCard(card: VocabCard): Promise<boolean> {
	if (!card.id) {
		throw new Error('Card must have id for update in pb')
	}
	let jsonCard = card as any
	for (const [property, value] of Object.entries(jsonCard.card)) {
		jsonCard[property] = value
	}
	delete jsonCard.card	
	return pb.collection('sr_cards').delete(jsonCard.id);
}

export function deleteAccount(username: string): Promise<boolean> {
	return pb.collection('users').delete(username);
}

/**
 * List all available games
 * @param {string} langId
 * @returns {Promise<any[]>}
 */
export async function getGames(langId: string): Promise<any[]> {
	return pb.collection('games').getFullList({filter: `lang = "${langId}"`})
}

/**
 * Get current user's player for the specified game
 * @param {string} gameId
 */
export async function getPlayer(gameId: string) {
	return pb.send(`/user_player/${gameId}`, {})
}

/**
 * Fetch the current player from the backend
 * @param {string} playerId
 */
export async function refreshPlayer(playerId: string) {
	return pb.collection('players').getFirstListItem(`id = "${playerId}"`)
}

/**
 * Update the current player in the backend
 * @param {any} player
 */
export async function updatePlayer(player: any) {
	return pb.collection('players').update(player.id, player)
}
    

/**
 * Send chat in game mode
 * @param {{role: string;content: string;}[]} chatHistory
 * @param {string} playerId
 * @param {Number} levelSeqId
 * @returns {Promise<{end_conversation: boolean;outcome: string;correction: DocumentC | undefined;response: DocumentC;}>} This document will have only the key text.text defined unless docId and targetLang were given as inputs //TODO: add a parameter inline to this function and the backend endpoint instead of this assumption
 */
export async function sendGameChat(chatHistory: { role: string; content: string; }[], playerId: string, levelSeqId: number): Promise<{ end_conversation: boolean; outcome: string; correction: DocumentC | undefined; response: DocumentC; }> {
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
export async function backendGet(path: string, authRequired: boolean=true) {
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
export async function backendPost(path: string, payload: object, authRequired: boolean=true) {
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
export async function sendFeedback(text: string, email: string | undefined) {	
	return pb.collection('feedback').create({text: text, email: email});
}

// Push Notifications
export function requestNotifications() {
	return subscribeUserToPush().then(subscription => pb.send('/webpush-subscribe', {method: 'POST', body: subscription}));
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

/**
 * Create a new game in PocketBase
 * @param {Object} game - The game object containing name, lang, and img.
 * @returns {Promise<any>} The created game object.
 */
export async function createGame(game: { name: string; lang: string; img: string }): Promise<any> {
  return pb.send('/new_game', {
    method: 'POST',
    body: game,
  });
}

/**
 * Create a new chapter in PocketBase
 * @param {Object} chapter - The chapter object containing all chapter details.
 * @returns {Promise<any>} The created chapter object.
 */
export async function createChapter(chapter: any): Promise<any> {
  return pb.collection('chapters').create(chapter);
}

/**
 * Check if the user is logged in
 * @returns {boolean} True if the user is logged in, false otherwise
 */
export function isLoggedIn(): boolean {
  return pb.authStore.isValid;
}

