<script lang="ts">
    import { onMount } from 'svelte';
    import ReaderComponent from './ReaderComponent.svelte';
    import WebPushSubscription from './WebPushSubscription.svelte';
    import { getTask, getUserTaskStats, sendReview } from './backend';
    import { user, nativeLang, targetLang, isSoundOn, ttsSpeed, currentTask, reviews, failedWords, reviewDocIds, currentlyScrolledParagraphIndex } from '$lib/stores';
	import { goto } from '$app/navigation';
	import Install from './Install.svelte';
	import Toast from './Toast.svelte';
	import NavbarComponent from './NavbarComponent.svelte';
	import ChatComponent from './ChatComponent.svelte';
	import SuccessPopup from './SuccessPopup.svelte';
	import DocumentC from '$lib/DocumentC';
	import TitleWithBackgroundImageComponent from './TitleWithBackgroundImageComponent.svelte';
	import FeedbackComponent from './FeedbackComponent.svelte';

    const answbtnTxtWhilePrompting = "Show translation"
    const answbtnTxtWhileSolutionShown = "Next"
    const answbtnTxtWhileChatting = "Next Text"
    const TOAST_REDIRECTED_SAVED_TASK = "Your selected text has been queued cause you have a saved text."
    const TEXT_REJECT_SAVED_TASK = "Discard saved"

    let loading = true
    let solutionText = ''
    var voice: SpeechSynthesisVoice
    var phase = "prompting"; // or "solutionShown"
    let toast: string | undefined;
    let textRejectToast: string | undefined;
    let readerComponent: ReaderComponent;
    let srWords: Set<string> | undefined;
    let nNewForms: number | undefined;
    let congratsMessage: string | undefined;
    let statsClosedPromise: Promise<boolean>;
    let statsClosedPromiseResolve: Function;
    let reviewsSentPromise: Promise<undefined>;
    $: chatFocussed = phase === 'chatting'; // focus chat when entering chatting phase (ChatComponent can still manage it's focus independently after this, e.g. unfocus even though we are in chatting phase)
    

  $: console.table($currentTask)

    onMount(async () => {
        let urlparams = new URLSearchParams(window.location.search)

        if (!$user) {
            $targetLang = 'pl'
            $nativeLang = 'en'
            $isSoundOn = false
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
            await nextTask($currentTask?.docId, true);

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
        let voices_in_lang = speechSynthesis.getVoices().filter(voice=>{return voice.lang.split(separator)[0].toUpperCase()===$targetLang.toUpperCase()})
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

    async function onAnswbtnClick () {
		if (phase === "prompting") {
            phase = "solutionShown"
            trySpeakCurrentTask()
		} else if (phase === "solutionShown") {
            speechSynthesis.cancel()

            const correctedWords = (srWords?.difference($failedWords))?.size // this is kinda cheating cause srWords are lemmas and failedWords are forms, but it's not easily fixable without saving the whole Token object somewhere

            if ($currentTask && $user) {
                $reviews.push(structuredClone($failedWords))
                $reviews = $reviews
                $reviewDocIds.push($currentTask.docId)
                $reviewDocIds = $reviewDocIds
                $failedWords.clear()
                $failedWords = $failedWords
            }

            reviewsSentPromise = sendPendingReviews()

            statsClosedPromise = new Promise<boolean>((resolve, reject) => {
                statsClosedPromiseResolve = resolve
            })
            congratsMessage = 
                (
                    (nNewForms ? `You just encountered ${nNewForms} new words!\n` : '')
                  + (correctedWords ? `You remembered ${correctedWords} word families you had wrong before!\n` : '')
                ) || 'Keep up that pace! 🏃';

            let goToChat = await statsClosedPromise

            if (goToChat) {
                phase = "chatting"
                
            } else {
                phase = "done"
            }
        } else if (phase === 'chatting') {
            phase = 'done'
        }

        if (phase === "done") {
            $currentTask = undefined
            solutionText = ''
            loading = true

            try {
                await reviewsSentPromise
            } catch (rejection) {
                toast = "Offline. Your data was saved."
                setTimeout(() => {
                    goto('/catalog')
                }, 1500);
                return
            }
            
            if ($user) {
                nextTask(getUrlDoc()) // IMPROVEMENT: we could even pre-fetch the next task while stats popup is shown
                goto('/', {replaceState: true})
            } else {
                goto('/signup')
            }
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
            try {
                await sendReview($targetLang, $reviewDocIds[0], Array.from($reviews[0]))            
            } catch (offlineError) {
                return Promise.reject(offlineError)
            }
            
            $reviews.shift()
            $reviews = $reviews
            $reviewDocIds.shift()
            $reviewDocIds = $reviewDocIds 
        }
        return 
    }


    async function nextTask(docId: string | null, restoreScrollPosition: boolean = false){
        let doc        
        if (!$user) { //anonymous mode
            doc = DocumentC.getSampleDoc()
        } else {
            doc = await getTask($targetLang, docId).catch(_offline => {
                toast = "Text has not been downloaded offline. Going to catalog."
                setTimeout(() => {
                    goto('/catalog')   
                }, 2000);
                return undefined
            })
        }
        
        if (doc) loading = false;
        phase = "prompting"
        $currentTask = doc
        
        
        solutionText = doc?.title?.translations[$nativeLang] + '\n\n' + doc?.text?.translations[$nativeLang]

        if (!restoreScrollPosition) {
            $currentlyScrolledParagraphIndex = 0
        }

        try {         
            const [srWords_l, newForms_l] = $user ? await getUserTaskStats($targetLang, (String)(doc?.docId)) : [["ornage"], Object.values(doc?.title?.tokens).map(tok => tok.word).concat(Object.values(doc?.title?.tokens).map(tok => tok.word))]
            srWords = new Set(srWords_l)
            nNewForms = newForms_l.length
        } catch (_offline) {
            srWords = undefined
            nNewForms = undefined
        }
    }

</script>

<TitleWithBackgroundImageComponent>Automated Language Learning AI</TitleWithBackgroundImageComponent>
{#if !$user}
    <strong>In this demo text, you learn the fabulous <em>Drnuk</em> language (and how this app works).</strong> <!-- If you want to dive right in with Polish, create an account at the bottom.-->
{/if}
<ReaderComponent phase={phase} trySpeak={trySpeak} solutionText={solutionText} taskVisible={!loading} srWords={srWords} bind:this={readerComponent}/>
<div>
    <button id="answbtn" class:loading on:click={onAnswbtnClick}>
        {#if phase === 'prompting'}
            {answbtnTxtWhilePrompting}
        {:else if phase === 'solutionShown'}
            {answbtnTxtWhileSolutionShown}
        {:else if phase === 'chatting'}
            {answbtnTxtWhileChatting}
        {/if}
    </button>
</div>
<ChatComponent readerComponent={readerComponent} chatFocussed={chatFocussed}/>
<NavbarComponent>
    <button on:click={()=>goto("/catalog")}>Texts</button>
    <button id="btnSound" on:click={onSoundClick}>{$isSoundOn ? '🔊' : '🔈'}</button>
    <Install/>
    <FeedbackComponent />
    {#if $user}
        <button on:click={()=>goto("/lists")}>My vocab</button>
        <WebPushSubscription loading={loading}/>
    {:else}
        <button on:click={()=>goto("/signup")}><b>Sign up 👤</b></button>
    {/if}
</NavbarComponent>
<Toast message={toast} textReject={textRejectToast} onReject={() => {
    $failedWords = [];
    location.reload();
}}/>
<SuccessPopup message={congratsMessage} onClose={goToChat=>{congratsMessage = undefined; statsClosedPromiseResolve(goToChat)}} chatPrompt={$currentTask?.question?.text}/>
