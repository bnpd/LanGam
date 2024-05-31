<script lang="ts">
    import { onMount } from 'svelte';
    import ReaderComponent from './ReaderComponent.svelte';
    import AppState from './AppState';
    import WebPushSubscription from './WebPushSubscription.svelte';
    import { backendPost, getTask } from './backend';

    const answbtnTxtWhilePrompting = "Show solution"
    const answbtnTxtWhileSolutionShown = "Next question"

    let loading = true
    let solutionText = ''
    var voice: SpeechSynthesisVoice
    var state: AppState
    var phase = "prompting"; // or "solutionShown"

    onMount(async () => {
        let urlparams = new URLSearchParams(window.location.search)
        var user = urlparams.get('u'), target_lang=urlparams.get('tl'), native_lang=urlparams.get('nl'), method=urlparams.get('mtd') // temporary solution only use url params for user languages

        state = new AppState(urlparams)
	    await state.loadCurrentTaskFromReviews()


        if (!user) {
            user = localStorage.getItem('username');
            target_lang = localStorage.getItem('target_lang');
            native_lang = localStorage.getItem('native_lang');
            method = localStorage.getItem('method');
        } else {
            target_lang = target_lang.toLowerCase();
            native_lang = native_lang.toLowerCase();
            localStorage.setItem('username', user);
            localStorage.setItem('target_lang', target_lang);
            localStorage.setItem('native_lang', native_lang);
            localStorage.setItem('method', method);
        }

        if (!user) {
            console.error('Login missing.');
            return;
        }


        // run setVoice when voices are loaded (onvoiceschanged)
        if (
        typeof speechSynthesis !== "undefined" &&
        speechSynthesis.onvoiceschanged !== undefined
        ) {
        speechSynthesis.onvoiceschanged = setVoice
        }
        if (speechSynthesis.getVoices() && speechSynthesis.getVoices().length) {
            setVoice()  // if we were too slow and the voice has already been set before speechSynthesis.onvoiceschanged = setVoice, just call setVoice immediately
        }

        // load task (restore saved state or next due task or given by doc url parameter)
        let urldoc = urlparams.get('doc') || urlparams.get('queuedDoc');
        window.history.pushState({}, document.title, "/" ); // remove URL param docId since we are no longer in that document (otherwise would've been param to this function)
        if (state.reviews.length > 0) {
            // we have a saved state from last session to restore
            console.log(state);
            await nextTask(state.currentTask?.docId);

            // click words, which will add them to state.failedWords and mark them on the page
            let targetFailedWords = structuredClone(state.failedWords);
            state.failedWords.clear()
            for (const word of targetFailedWords) { // mark words that were marked in last session
                for (const el of document.getElementsByClassName('span-'+word)) {
                    (el as HTMLSpanElement).click()
                }
            }

            if (urldoc && urldoc != state.currentTask?.docId) {
                window.history.pushState({}, document.title, "/?queuedDoc=" + urldoc); //= urlparams.set('queuedDoc', urldoc)
            }			
        } else {
            nextTask(urldoc); 
        }
    })


    function setVoice() {
        const separator = speechSynthesis.getVoices()[0].lang.includes('-') ? '-' : '_'
        let voices_in_lang = speechSynthesis.getVoices().filter(voice=>{return voice.lang.split(separator)[0].big()===state.target_lang.big()})
        if (voices_in_lang.length!==0) {
            voice = voices_in_lang[0]
        }
    }

    function trySpeak(str) {
        if (voice != null) {
            let utterance = new SpeechSynthesisUtterance(str)
            utterance.voice = voice
            utterance.lang = voice.lang
            utterance.rate = state.tts_speed
            speechSynthesis.speak(utterance)
        }
    }

    function onAnswbtnClick () {
		if (phase === "prompting") {
            phase = "solutionShown"
			if (state.sound) {
				trySpeak((state.currentTask.title.text + '\n' + state.currentTask.text.text).replace(/\xa0/g, '')) // remove nbsp just in case its a problem
			}
		} else if (phase === "solutionShown") {
			speechSynthesis.cancel()
            loading = true

			solutionText = ''
			loading = true
			sendPendingReviews()
			.then(async () => {
				nextTask(new URLSearchParams(window.location.search).get('queuedDoc'))
				window.history.pushState({}, document.title, "/" )
			})
		}
    }

    function onSoundClick() {
		state.sound = ! state.sound
		if (state.sound) {
			if (phase === "solutionShown") {
				trySpeak((state.currentTask.title.text + '\n' + state.currentTask.text.text).replace(/\xa0/g, '')); // remove nbsp just in case its a problem
			}
		} else {
			speechSynthesis.cancel()
		}
    }

    /**
     * Send user marked words to backend, by dequeuing them from state.reviews
     * @returns {Promise<unknown>} Promise that is resolved when send was successful
     */
    function sendPendingReviews(){
        return new Promise<void>((resolve, _reject) => {
            if (state.reviews.length == 0) {
                return resolve()
            }
            const review = state.reviews.at(0)
            const json = {docId: review[0], failedTokens: [...review[1]]}
            backendPost('/review/'+state.user, json, _success => {
                state.reviews.dequeue()
                sendPendingReviews().then(resolve)
            })
            // TODO: on reject or timeout, retry regularly and on next app open
        })
    }


    async function nextTask(docId){
        let doc = await getTask(state.user, docId)
        loading = false
        phase = "prompting"
        state.currentTask = doc
        solutionText = doc.title.translations[state.native_lang] + '\n\n' + doc.text.translations[state.native_lang]
    }

</script>




<!-- Main Application -->
<h1>Automated Language Learning AI</h1>
<ReaderComponent state={state} phase={phase} trySpeak={trySpeak} solutionText={solutionText} taskVisible={!loading}/>
<button id="btnInstall" hidden>Install as app</button>
<button id="answbtn" class:loading on:click={onAnswbtnClick}>
    {#if phase === 'prompting'}
        {answbtnTxtWhilePrompting}
    {:else if phase === 'solutionShown'}
        {answbtnTxtWhileSolutionShown}
    {/if}
</button>
<WebPushSubscription user={state?.user}/>
<button id="btnSound" on:click={onSoundClick}>{state?.sound ? '🔊' : '🔈'}</button>
<nav>
    <a href="lists.html" id="aManageLists">See your vocabulary</a>
</nav>