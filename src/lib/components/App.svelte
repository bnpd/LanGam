<script lang="ts">
    import { onMount } from 'svelte';
    import ReaderComponent from './ReaderComponent.svelte';
    import WebPushSubscription from './WebPushSubscription.svelte';
    import { backendPost, getTask, getTopTasks } from './backend';
    import { user, nativeLang, targetLang, isSoundOn, ttsSpeed, currentTask, reviews, failedWords, reviewDocIds } from '$lib/stores';
	import { goto } from '$app/navigation';
	import Install from './Install.svelte';
	import Toast from './Toast.svelte';
	import NavbarComponent from './NavbarComponent.svelte';
	import ChatComponent from './ChatComponent.svelte';

    const answbtnTxtWhilePrompting = "Show solution"
    const answbtnTxtWhileSolutionShown = "Next question"
    const TOAST_REDIRECTED_SAVED_TASK = "Your selected text has been queued cause you have a saved text."
    const TEXT_REJECT_SAVED_TASK = "Discard saved"

    let loading = true
    let solutionText = ''
    var voice: SpeechSynthesisVoice
    var phase = "prompting"; // or "solutionShown"
    let toast: string | undefined;
    let textRejectToast: string | undefined;
    

    onMount(async () => {
        let urlparams = new URLSearchParams(window.location.search)
        if (urlparams.get('u')) $user = urlparams.get('u');
        if (urlparams.get('tl')) $targetLang = urlparams.get('tl')?.toLowerCase();
        if (urlparams.get('nl')) $nativeLang = urlparams.get('nl')?.toLowerCase();

        if (!$user) {
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
        
        goto('/', {replaceState: true}); // remove URL param docId since we are no longer in that document (otherwise would've been param to this function)
                
        if ($failedWords.size > 0) {            
            // we have a saved state from last session to restore
            await nextTask($currentTask?.docId);

            // click words, which will add them to $failedWords and mark them on the page
            // sound off while doing this
            const savedSoundSetting = $isSoundOn
            $isSoundOn = false
            const targetFailedWords = structuredClone($failedWords);
            $failedWords.clear()
            for (const word of targetFailedWords) { // mark words that were marked in last session
                let el = document.getElementsByClassName('span-'+word)[0] // we only click the first one, it will mark all of them
                if (el) {
                    (el as HTMLSpanElement).click()
                }
            }
            $isSoundOn = savedSoundSetting

            if (urldoc && urldoc != $currentTask?.docId) {
                goto('/?queuedDoc=' + urldoc, {replaceState: true}); //= urlparams.set('queuedDoc', urldoc)
                toast = TOAST_REDIRECTED_SAVED_TASK;
                textRejectToast = TEXT_REJECT_SAVED_TASK
            }			
        } else {
            nextTask(urldoc); 
        }
    })


    function setVoice() {
        const separator = speechSynthesis.getVoices()[0].lang.includes('-') ? '-' : '_'
        let voices_in_lang = speechSynthesis.getVoices().filter(voice=>{return voice.lang.split(separator)[0].big()===$targetLang.big()})
        if (voices_in_lang.length!==0) {
            voice = voices_in_lang[0]
        }
    }

    function trySpeakCurrentTask() {
        trySpeak(($currentTask.title.text + '\n' + $currentTask.text.text).replace(/\xa0/g, '').replaceAll('#', '')) // remove nbsp just in case its a problem, and remove hashtags
    }

    function trySpeak(str: string) {
        if ($isSoundOn && voice != null) {
            let utterance = new SpeechSynthesisUtterance(str)
            utterance.voice = voice
            utterance.lang = voice.lang
            utterance.rate = $ttsSpeed
            speechSynthesis.speak(utterance)
        }
    }

    function onAnswbtnClick () {
		if (phase === "prompting") {
            phase = "solutionShown"
            trySpeakCurrentTask()
		} else if (phase === "solutionShown") {
			speechSynthesis.cancel()
            loading = true

			solutionText = ''
			loading = true

            if ($currentTask) {
                $reviews.push(structuredClone($failedWords))
                $reviews = $reviews
                $reviewDocIds.push($currentTask.docId)
                $reviewDocIds = $reviewDocIds
                $failedWords.clear()
                $failedWords = $failedWords
                $currentTask = undefined
            }         

			sendPendingReviews()
			.then(async _done => {        
				nextTask(getUrlDoc())
				goto('/', {replaceState: true})
			}, _offline => {
                toast = "Offline. Your data was saved."
                setTimeout(() => {
                    goto('/catalog') //TODO: filter catalog to only show cached documents      
                }, 1500);
            })
		}
    }

    function onSoundClick() {
		$isSoundOn = ! $isSoundOn
		if ($isSoundOn) {
            trySpeakCurrentTask()
		} else {
			speechSynthesis.cancel()
		}
    }

    function getUrlDoc() {
        const urlparams = new URLSearchParams(window.location.search) 
        return urlparams.get('doc') || urlparams.get('queuedDoc')
    }

    /**
     * Send queued reviews to backend
     * @returns {Promise<unknown>} Promise that is resolved when send was successful or rejected if offline
     */
    async function sendPendingReviews(){
        const times = $reviewDocIds.length
        for (let i = 0; i < times; i++) {
            const json = {docId: $reviewDocIds[0], failedTokens: Array.from($reviews[0])}
            console.log(JSON.stringify(json));
            try {
                await backendPost('/review/'+$user, json)                
            } catch (offlineError) {
                return Promise.reject(offlineError)
            }
            // onSuccessfulPost, dequeue
            console.log('SHOULDNT GET HWERE WHEN OFFLINE');
            
            $reviews.shift()
            $reviews = $reviews
            $reviewDocIds.shift()
            $reviewDocIds = $reviewDocIds 
        }
        return 
    }


    async function nextTask(docId: string | null){
        let doc = await getTask($user, docId).catch(_offline => {
            toast = "Text has not been downloaded offline. Going to catalog."
            setTimeout(() => {
                goto('/catalog') //TODO: filter catalog to only show cached documents      
            }, 2000);
            return undefined
        })
        if (doc) loading = false;
        phase = "prompting"        
        $currentTask = doc
        solutionText = doc?.title?.translations[$nativeLang] + '\n\n' + doc?.text?.translations[$nativeLang]
    }

</script>




<!-- Main Application -->
<h1>Automated Language Learning AI</h1>
<ReaderComponent phase={phase} trySpeak={trySpeak} solutionText={solutionText} taskVisible={!loading}/>
<div>
    <button id="btnSound" on:click={onSoundClick}>{$isSoundOn ? '🔊' : '🔈'}</button>
    <button id="answbtn" class:loading on:click={onAnswbtnClick}>
        {#if phase === 'prompting'}
            {answbtnTxtWhilePrompting}
        {:else if phase === 'solutionShown'}
            {answbtnTxtWhileSolutionShown}
        {/if}
    </button>
</div>
<ChatComponent />
<NavbarComponent>
    <button on:click={()=>goto("/catalog")}>Texts</button>
    <button on:click={()=>goto("/lists")}>My vocab</button>
    <Install/>
    <WebPushSubscription/>
</NavbarComponent>
<Toast message={toast} textReject={textRejectToast} onReject={() => {
    $failedWords = [];
    location.reload();
}}/>