import { writable } from 'svelte/store';

/* Global Stores */
export const user = createPersistentStore('username', null);
export const targetLang = createPersistentStore('target_lang', null);
export const nativeLang = createPersistentStore('native_lang', null);
export const loadingTask = writable()

/* Study Component Stores */
export const isSoundOn = createPersistentStore('isSoundOn', true);
export const ttsSpeed = createPersistentStore('ttsSpeed', 0.8);
export const reviews = createPersistentStore('reviews', []);
export const reviewDocIds = createPersistentStore('reviewOrder', []);
export const failedWords = createPersistentStore('failedWords', new Set());
export const currentTask = createPersistentStore('currentTask', null);
export const currentlyScrolledParagraphIndex = createPersistentStore('currentScrolledParagraphIndex', 0);


/* Store Creation Functions */

function createPersistentStore(key: string, initialValue: any) {
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


