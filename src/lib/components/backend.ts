'use strict';
import { PUBLIC_POCKETBASE_URL, PUBLIC_WEBPUSH_PUBLIC_KEY } from '$env/static/public';
import { VocabCard } from '$lib/fsrs.js';
import DocumentC from '$lib/DocumentC'
import PocketBase, { type RecordModel } from 'pocketbase';

// PocketBase
const pb = new PocketBase(PUBLIC_POCKETBASE_URL)
const MAX_CHAT_HISTORY_LENGTH = 20
const MAX_CHAT_HISTORY_CHARS = 20000


/**
 * Check if the user is logged in
 * @returns {boolean} True if the user is logged in, false otherwise
 */
export function isLoggedIn(): boolean {
	return pb.authStore.isValid;
}

/**
 * @param {string} user
 * @param {string} password
 */
export async function login(user: string, password: string) {
	return pb.collection('users').authWithPassword(user, password);
}


export async function loginWithGoogle() {
	return pb.collection('users').authWithOAuth2({ provider: 'google' });
}


/**
 * @param {string} email
 * @param {string} password
 */
export async function signup(email: string, password: string) {
	let resPromise = pb.collection('users').create({email: email, password: password, passwordConfirm: password})
	//pb.collection('users').requestVerification(email).catch(err=>console.error(err))
	return resPromise
}


export async function newUserLang(targetLang: string): Promise<{expand: {target_lang: any}}> {
	if (!pb.authStore.isValid || !pb.authStore.record) {
		throw new Error('User not logged in.');
	}
	return pb.collection('user_langs').create({
		'target_lang': targetLang.toLowerCase(),
		'user': pb.authStore.record.id
	}, {expand: 'target_lang'})
}


/**
 * @param {string} langId id of the language in pocketbase
 */
export async function getLangById(langId: string) {
	return pb.collection('langs').getOne(langId);
}


export function getUserData() {
	return pb.authStore?.record
}


/**
 * @param {string} user
 * @param {string} targetLangId
 */
export async function getUserLang(user: string, targetLangId: string){
	return pb.collection('user_langs').getFirstListItem(`user = "${user}" && target_lang = "${targetLangId}"`)
}

export async function getAllLanguages(): Promise<RecordModel[]> {
	return pb.collection('langs').getFullList()
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
	let {response} = await pb.send('chat_tutor', {query: {hist: chatHistoryText, ctx: contextParagraphs}})
	return DocumentC.fromJson(response)
}

export async function getLevel(gameId: string, seqId: number, nativeLanguage?: string, desiredSimplificationLevel?: string): Promise<{level: RecordModel, translations: RecordModel[], actualSimplificationLevel: string}> {
	return pb.send('/level_with_translations_and_grammar', {query: {gameId, seqId, nativeLanguage, simplificationLevel: desiredSimplificationLevel}})
}

/**
 * @param {string} playerId
 */
export async function getPlayerLevel(playerId: string, nativeLanguage?: string, desiredSimplificationLevel?: string): Promise<{level: RecordModel, translations: RecordModel[], actualSimplificationLevel: string}> {
	return pb.send(`/player_level/${playerId}`, {query: {simplificationLevel: desiredSimplificationLevel, nativeLanguage}})
}

export async function getTranslations(levelId: string, targetLang: string, actualSimplificationLevel: string = ''): Promise<RecordModel[]> {
	return pb.collection('translations').getFullList({filter: `level = "${levelId}" && lang = "${targetLang}" && simplification = "${actualSimplificationLevel}"`})
}

/**
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
 * @returns {Promise<any>} The updated player
 */
export async function completeLevelAnon(player: any, seqId: number, outcome: string): Promise<any> {
	return pb.send(`/complete_level_anon`, {method: 'POST', body: {
		player: player, 
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
export async function getGamesByLang(langId: string): Promise<any[]> {
	return pb.collection('games').getFullList({filter: `lang = "${langId}"`})
}

/**
 * List all games owned by this user
 * @returns {Promise<any[]>}
 */
export async function getOwnGames(): Promise<any[]> {
	return pb.collection('games').getFullList({filter: `owner = "${getUserData()?.id}"`})
}

/**
 * Get/Create current user's player for the specified game
 * @param {string} gameId
 * @param {{ [x: string]: any; }} [playerCreateData] - Optional player data to send to the backend. Only stats, powers, level and level_history are used.
 */
export async function getPlayer(gameId: string, playerCreateData?: { [x: string]: any; }): Promise<RecordModel> {
	return pb.send(`/user_player/${gameId}`, { method: 'POST', body: playerCreateData ? {playerCreateData} : undefined })
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
 * Update the current user in the backend
 * @param {{ [x: string]: any; }} changedData
 * @return {Promise<RecordModel>} The updated user record
 */
export async function updateUser(changedData: { [x: string]: any; }): Promise<RecordModel> {
	let user = getUserData()
	if (!user) {
		throw new Error('User not logged in.')
	}
	for (const [property, value] of Object.entries(changedData)) {
		user[property] = value
	}
	return pb.collection('users').update(user.id, user)
}
    

/**
 * Send chat in game mode with player logged in
 */
export async function sendGameChat(chatHistory: { role: string; content: string; }[], playerId: string): Promise<{ end_conversation: boolean; outcome: string; correction: DocumentC | undefined; response: DocumentC; player: RecordModel | undefined; }> {
	const chatHistoryText = JSON.stringify(chatHistory.slice(-MAX_CHAT_HISTORY_LENGTH))
	if (chatHistoryText.length > MAX_CHAT_HISTORY_CHARS) {
		throw new Error("Chat history too long.");		
	}
	let {correction_of_learner_message, response, end_conversation, outcome, player: updatedPlayer} = await pb.send('chat_game', {query: {hist: chatHistoryText, playerId: playerId}})
	return {end_conversation, outcome, correction: correction_of_learner_message ? DocumentC.fromJson(correction_of_learner_message) : undefined, response: DocumentC.fromJson(response), player: updatedPlayer}
}

/**
 * Send chat in game mode without player logged in
 */
export async function sendGameChatAnon(chatHistory: { role: string; content: string; }[], player: Object): Promise<{ end_conversation: boolean; outcome: string; correction: DocumentC | undefined; response: DocumentC; player: RecordModel | undefined; }> {
	const chatHistoryText = JSON.stringify(chatHistory.slice(-MAX_CHAT_HISTORY_LENGTH))
	if (chatHistoryText.length > MAX_CHAT_HISTORY_CHARS) {
		throw new Error("Chat history too long.");		
	}
	let {correction_of_learner_message, response, end_conversation, outcome, player: updatedPlayer} = await pb.send('/chat_game_anon', {query: {hist: chatHistoryText, player}})
	return {end_conversation, outcome, correction: correction_of_learner_message ? DocumentC.fromJson(correction_of_learner_message) : undefined, response: DocumentC.fromJson(response), player: updatedPlayer}
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
				applicationServerKey: PUBLIC_WEBPUSH_PUBLIC_KEY,
			};
			return registration.pushManager.subscribe(subscribeOptions);
		})
		.then(pushSubscription => {
			return pushSubscription;
			});
}

/**
 * Create a new game in PocketBase
 * @param {Object} game - The game object.
 * @returns {Promise<any>} The created game object.
 */
export async function createGame(game: { name: string; lang: string; img: string; public: boolean }): Promise<any> {
  return pb.collection('games').create(game);
}

/**
 * Create a new chapter in PocketBase
 * @param {Object} chapter - The chapter object containing all chapter details.
 * @returns {Promise<any>} The created chapter object.
 */
export async function createChapter(chapter: any): Promise<any> {
  console.log(chapter);
  return pb.collection('levels').create({game: chapter.game, seq_id: chapter.seq_id, level: chapter});
}

