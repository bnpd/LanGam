<script lang="ts">
    import { onMount } from 'svelte';
    import ReaderComponent from './ReaderComponent.svelte';
    import WebPushSubscription from './WebPushSubscription.svelte';
    import { backendPost, getTask, getTopTasks } from './backend';
    import { user, nativeLang, targetLang, isSoundOn, ttsSpeed, currentTask, reviews, failedWords, reviewDocIds } from '$lib/stores';
	import { goto } from '$app/navigation';
	import Install from './Install.svelte';
	import Toast from './Toast.svelte';

    const answbtnTxtWhilePrompting = "Show solution"
    const answbtnTxtWhileSolutionShown = "Next question"
    const TOAST_REDIRECTED_SAVED_TASK = "Your selected text has been queued cause you have a saved text."
    const TEXT_REJECT_SAVED_TASK = "Discard saved"

    let loading = true
    let solutionText = ''
    var voice: SpeechSynthesisVoice
    var phase = "prompting"; // or "solutionShown"
    let toast: string | undefined;
    let urldoc: string | null;

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
        urldoc = urlparams.get('doc') || urlparams.get('queuedDoc');
        
        goto('/'); // remove URL param docId since we are no longer in that document (otherwise would've been param to this function)
                
        if ($failedWords.size > 0) {            
            // we have a saved state from last session to restore
            await nextTask($currentTask?.docId);

            // click words, which will add them to $failedWords and mark them on the page
            let targetFailedWords = structuredClone($failedWords);
            $failedWords.clear()
            for (const word of targetFailedWords) { // mark words that were marked in last session
                let el = document.getElementsByClassName('span-'+word)[0] // we only click the first one, it will mark all of them
                if (el) {
                    (el as HTMLSpanElement).click()
                }
            }

            if (urldoc && urldoc != $currentTask?.docId) {
                goto('/?queuedDoc=' + urldoc); //= urlparams.set('queuedDoc', urldoc)
                toast = TOAST_REDIRECTED_SAVED_TASK;
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
			trySpeak(($currentTask.title.text + '\n' + $currentTask.text.text).replace(/\xa0/g, '')) // remove nbsp just in case its a problem
		} else if (phase === "solutionShown") {
			speechSynthesis.cancel()
            loading = true

			solutionText = ''
			loading = true
			sendPendingReviews()
			.then(async () => {
				nextTask(urldoc)
				goto('/')
			})
		}
    }

    function onSoundClick() {
		$isSoundOn = ! $isSoundOn
		if ($isSoundOn) {
			trySpeak(($currentTask?.title?.text + '\n' + $currentTask?.text?.text).replace(/\xa0/g, '')); // remove nbsp just in case its a problem
		} else {
			speechSynthesis.cancel()
		}
    }

    /**
     * Send user marked words to backend, by dequeuing them from $reviews
     * @returns {Promise<unknown>} Promise that is resolved when send was successful
     */
    function sendPendingReviews(){
        return new Promise<void>((resolve, _reject) => {
            if ($currentTask) {                
                $reviews.push($failedWords)
                $reviewDocIds.push($currentTask.docId)
                $failedWords.clear()
                $currentTask = undefined
            }

            if ($reviews?.length == 0) {
                return resolve()
            }
            const json = {docId: $reviewDocIds[0], failedTokens: [...$reviews[0]]}
            backendPost('/review/'+$user, json, () => {
                // onSuccessfulPost, dequeue and go on to next 
                $reviews.shift()
                $reviewDocIds.shift()
                sendPendingReviews().then(resolve)
            })
            // TODO: on reject or timeout, retry regularly and on next app open
        })
    }


    async function nextTask(docId: string | null){
        let doc = await getTask($user, docId)
        loading = false
        phase = "prompting"
        $currentTask = doc
        solutionText = doc.title.translations[$nativeLang] + '\n\n' + doc.text.translations[$nativeLang]
    }

</script>




<!-- Main Application -->
<h1>Automated Language Learning AI</h1>
<ReaderComponent phase={phase} trySpeak={trySpeak} solutionText={solutionText} taskVisible={!loading}/>
<Install/>
<button id="answbtn" class:loading on:click={onAnswbtnClick}>
    {#if phase === 'prompting'}
        {answbtnTxtWhilePrompting}
    {:else if phase === 'solutionShown'}
        {answbtnTxtWhileSolutionShown}
    {/if}
</button>
<button on:click={()=>goto("/lists")} id="aManageLists">See your vocabulary</button>
<WebPushSubscription/>
<button id="btnSound" on:click={onSoundClick}>{$isSoundOn ? '🔊' : '🔈'}</button>
<Toast message={toast} textReject={TEXT_REJECT_SAVED_TASK} onReject={() => {
    $failedWords = [];
    location.reload();
}}/>