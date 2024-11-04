import { writable, type Writable } from 'svelte/store';
import type DocumentC from './DocumentC';

/* Global Stores */
export const username = createPersistentStore('username', null);
export const player = createPersistentStore('player', null);
export const targetLang = createPersistentStore('target_lang', null);
export const nativeLang = createPersistentStore('native_lang', null);
export const loadingTask: Writable<boolean> = writable()

/* Study Component Stores */
export const isSoundOn = createPersistentStore('isSoundOn', true);
export const ttsSpeed = createPersistentStore('ttsSpeed', 0.8);
export const reviews = createPersistentStore('reviews', []);
export const reviewDocIds = createPersistentStore('reviewOrder', []);
export const failedWords = createPersistentStore('failedWords', new Set());
export const currentTask = createPersistentStore('currentTask', null);
export const currentlyScrolledParagraphIndex = createPersistentStore('currentScrolledParagraphIndex', 0);
export const currentTaskNParagraphs: Writable<number> = writable();
export const currentGameId = createPersistentStore('currentGameId', null); // Duplicate from $player.game but this one is used for keeping track of whether saved state belongs to a game or a text. Should be undefined if saved state belongs to a text.
export const morphHighlightFilter = createPersistentStore('morphHighlightFilter', "Case=Ins");

/* Chat Component Stores */
export const inlineChatHistory: Writable<{role: string, content: DocumentC}[]> = createPersistentStore('inlineChatHistory', []);
export const gameChatHistory: Writable<{role: string, content: DocumentC}[]> = createPersistentStore('gameChatHistory', []);
export const chatOutcome = createPersistentStore('chatOutcome', null);

/* Dictionary Component / SR Stores */
export const dictionaryWord: Writable<string | undefined> = writable()
export const freqList = createPersistentStore('freqList', null);
export const srShowIPA = createPersistentStore('srShowIPA', true);
export const srShowGenus = createPersistentStore('srShowGenus', true);

/* One time flags */
export const grammarBookOpened = createPersistentStore('grammarBookOpened', false);
export const tutorOpened = createPersistentStore('tutorOpened', false);
//export const powersOpened = createPersistentStore('powersOpened', false);

/* Store Creation Functions */

function createPersistentStore(key: string, initialValue: any): Writable<any> {
    let storedValue;
    if (typeof localStorage !== 'undefined') {
        storedValue = localStorage.getItem(key);
    }
    let value;
    try {
        if (initialValue instanceof Set) {
            value = storedValue ? new Set(JSON.parse(storedValue)) : initialValue;
        } else {
            value = storedValue ? JSON.parse(storedValue) : initialValue;
        }
    } catch (error) {
        value = storedValue;
    }
    const store = writable(value);

    if (typeof localStorage !== 'undefined') {
        if (initialValue instanceof Set) {
            store.subscribe((value) => {                
                localStorage.setItem(key, JSON.stringify(Array.from(value)));
            });            
        } else {
            store.subscribe((value) => {
                if (value instanceof Array && value.length > 0 && value[0] instanceof Set) {            
                    localStorage.setItem(key, JSON.stringify(value.map(el => Array.from(el)))); 
                } else {
                    localStorage.setItem(key, JSON.stringify(value));
                }
            });
        }
    }

    return store;
}


