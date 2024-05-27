import { getTask } from "./backend.js";

export default
class AppState {
    constructor(urlparams, btnSound) {
        // UUI elements that only depend on the state
        this._btnSound = btnSound // manages the icon shown on the button
        this._phase = "promting"; // or "solutionShown"

        this._user = urlparams.get('u');
        this._target_lang = urlparams.get('tl');
        this._native_lang = urlparams.get('nl');
        this.sound = localStorage.getItem('sound') ? JSON.parse(localStorage.getItem('sound')) : true;
        this._tts_speed = 0.8;

        this._reviews = new PersistentQueue('reviews');
        this._currentTask = null;

        if (this._user) { // overwrite stored user if user not provided in url
            this._target_lang = this._target_lang.toLowerCase();
            this._native_lang = this._native_lang.toLowerCase();
            localStorage.setItem('username', this._user);
            localStorage.setItem('target_lang', this._target_lang);
            localStorage.setItem('native_lang', this._native_lang);
        } else {
            this._user = localStorage.getItem('username');
            this._target_lang = localStorage.getItem('target_lang');
            this._native_lang = localStorage.getItem('native_lang');
        }

        // do not keep last empty reviews, they are most likely the user existing right after the task was shown
        if (this.failedWords?.size == 0) {
            this.reviews?.pop()
        }
    }

    // Getter and Setter for phase
    get phase() {
        return this._phase;
    }

    set phase(value) {
        this._phase = value;
    }

    // Getter and Setter for user
    get user() {
        return this._user;
    }

    set user(value) {
        this._user = value;
        localStorage.setItem('username', value);
    }

    // Getter and Setter for target_lang
    get target_lang() {
        return this._target_lang;
    }

    set target_lang(value) {
        this._target_lang = value.toLowerCase();
        localStorage.setItem('target_lang', this._target_lang);
    }

    // Getter and Setter for native_lang
    get native_lang() {
        return this._native_lang;
    }

    set native_lang(value) {
        this._native_lang = value.toLowerCase();
        localStorage.setItem('native_lang', this._native_lang);
    }

    // Getter and Setter for sound
    get sound() {
        return this._sound;
    }

    set sound(value) {
        this._sound = value;
		localStorage.setItem('sound', this._sound);
		this._btnSound.innerText = this._sound ? '🔊' : '🔈'
    }

    // Getter and Setter for tts_speed
    get tts_speed() {
        return this._tts_speed;
    }

    set tts_speed(value) {
        this._tts_speed = value;
    }

    // Getter for reviews
    get reviews() {
        return this._reviews;
    }


    get failedWords() {
        return this.reviews.at(-1)[1];
    }


    set failedWords(value) {
        this.reviews.at(-1)[1] = value;
    }

    get currentTask() {
        return this._currentTask;
    }

    set currentTask(doc) {
        this._currentTask = doc;
        this.reviews.enqueue(doc.docId, new Set());
    }

    async loadCurrentTaskFromReviews() {
        if (this.reviews.length > 0) {
            const savedDocId = this.reviews.at(-1)[0];
            await getTask(this.user, savedDocId)
            .then(doc => {
                this._currentTask = doc
            })
            .catch(e => {
                console.error(e)
                this.reviews.pop() // remove the offending last element from the queue
            })
        }
    }
}


/**
 * A JSON based Queue that is initialized from localStorage key and changes are saved to localStorage. It is one big JSON where the queue order is being kept track of by the _queue array.
 */
class PersistentQueue {
    constructor(key) {
        this.storageKey = key;
        this._queue = [];
        this.load(); // overwrites storageKey and _queue if found
    }

    enqueue(key, value) {
        if (!this.hasOwnProperty(key)) {
            this[key] = new PersistentSet(key, this);
            for (const item of value) {
                this[key].add(item);
            }
            this._queue.push(key);
            this.save();
        }
    }

    dequeue() {
        const key = this._queue.shift();
        if (key) {
            const value = this[key];
            delete this[key];
            this.save();
            return { key, value };
        }
        return null;
    }

    clear() {
        for (const key of this._queue) {
            delete this[key];
        }
        this._queue = [];
        this.save();
    }

    save() {
        const data = {
            queue: this._queue,
            items: {}
        };

        for (const key of this._queue) {
            data.items[key] = [...this[key]];
        }

        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    load() {
        const storedData = localStorage.getItem(this.storageKey);
        if (storedData) {
            const data = JSON.parse(storedData);
            this._queue = data.queue || [];
            for (const docId of this._queue) {
                this[docId] = new PersistentSet(docId, this);
                for (const item of data.items[docId]) {
                    this[docId].add(item);
                }
            }
        }
    }

    at(i) {
        if (i < 0) {
            i += this._queue.length;
        }
        const key = this._queue[i];
        return [key, this[key]];
    }

    /**
     * Remove the LAST value from the queue
     * @returns the LAST value in the queue
     */
    pop() {
        const key = this._queue.pop();
        if (key) {
            const value = this[key];
            delete this[key];
            this.save();
            return { key, value };
        }
        return null;
    }

    get items() {
        return this._queue.map(key => ({ key, value: this[key] }));
    }

    get length() {
        return this._queue.length;
    }
}


class PersistentSet extends Set {
    constructor(key, parentQueue) {
        super();
        this.key = key;
        this.parentQueue = parentQueue;
    }

    add(value) {
        const result = super.add(value);
        this.parentQueue.save();
        return result;
    }

    delete(value) {
        const result = super.delete(value);
        this.parentQueue.save();
        return result;
    }

    clear() {
        super.clear();
        this.parentQueue.save();
    }
}