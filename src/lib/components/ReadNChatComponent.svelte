<script lang="ts" defer>
    import { onMount } from 'svelte';
    import ReaderComponent from './ReaderComponent.svelte';
    import { getTask, getUserTaskStats, sendReview } from './backend';
    import { username, nativeLang, targetLang, isSoundOn, currentTask, reviews, failedWords, reviewDocIds, currentlyScrolledParagraphIndex, loadingTask, inlineChatHistory, currentGameId, gameChatHistory } from '$lib/stores';
	import { goto } from '$app/navigation';
	import Toast from './Toast.svelte';
	import ChatComponent from './ChatComponent.svelte';
	import SuccessPopup from './SuccessPopup.svelte';
	import DocumentC from '$lib/DocumentC';
	import type TtsComponent from './TtsComponent.svelte';

    const answbtnTxtWhileSolutionShown = "Next text"
    const TOAST_REDIRECTED_FROM_TASK = "Your selected text has been queued cause you have a saved text."
    const TOAST_REDIRECTED_FROM_GAME = "Your selected game has been queued cause you have a saved text."
    const TEXT_REJECT_SAVED_TASK = "Discard saved"

    export let tts: TtsComponent;

    let solutionText = ''
    let toast: string | undefined;
    let textRejectToast: string | undefined;
    let readerComponent: ReaderComponent;
    let srWords: Set<string> | undefined;
    let nNewForms: number | undefined;
    let congratsMessage: string | undefined;
    let statsClosedPromise: Promise<boolean>;
    let statsClosedPromiseResolve: Function;
    let reviewsSentPromise: Promise<undefined>;
    let redirectedGame: string | null

    onMount(async () => {
        let urlparams = new URLSearchParams(window.location.search)

        if (!$username) {
            $targetLang = {shortcode: 'pl'} //TODO: getLangByShortcode('pl') from pocketbase
            $nativeLang = 'en'
            $isSoundOn = false
        }

        // load task (restore saved state or next due task or given by doc url parameter)
        let urldoc = urlparams.get('doc') || urlparams.get('queuedDoc');
        
        if(urldoc) goto('/read', {replaceState: true}); // remove URL param docId since we have saved it
                
        if ($failedWords.size > 0 || $inlineChatHistory.length > 1 || $gameChatHistory.length > 1) {
            // we have a saved state from last session to restore

            if($currentGameId) { // but it belongs to a game, so redirect
                goto('/game' + (urldoc ? `?redirectedDoc=${urldoc}` : ''));
                return
            }

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

            redirectedGame = new URLSearchParams(window.location.search).get('redirectedGame')

            if (redirectedGame) {
                toast = TOAST_REDIRECTED_FROM_GAME;
                textRejectToast = TEXT_REJECT_SAVED_TASK
            } else if (urldoc && urldoc != $currentTask?.docId) {
                goto('/read?queuedDoc=' + urldoc, {replaceState: true}); //= urlparams.set('queuedDoc', urldoc)
                toast = TOAST_REDIRECTED_FROM_TASK;
                textRejectToast = TEXT_REJECT_SAVED_TASK
            }			
        } else {
            await nextTask(urldoc); 
            initChatHistory();
        }
    })

    async function onAnswbtnClick () {
        speechSynthesis.cancel()

        const correctedWords = (srWords?.difference($failedWords))?.size // this is kinda cheating cause srWords are lemmas and failedWords are forms, but it's not easily fixable without saving the whole Token object somewhere

        if ($currentTask && $username) {
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

        await statsClosedPromise

        $currentTask = undefined
        solutionText = ''
        $loadingTask = true

        try {
            await reviewsSentPromise
        } catch (rejection) {
            toast = "Offline. Your data was saved."
            setTimeout(() => {
                goto('/catalog')
            }, 1500);
            return
        }
        
        if ($username) {
            await nextTask(getUrlDoc()) // IMPROVEMENT: we could even pre-fetch the next task while stats popup is shown
            initChatHistory()
            goto('/read', {replaceState: true})
        } else {
            goto('/signup')
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
                await sendReview($targetLang.shortcode, $reviewDocIds[0], Array.from($reviews[0]))            
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
        if (!$username) { //anonymous mode
            doc = DocumentC.getSampleDoc()
        } else {
            doc = await getTask($targetLang.shortcode, docId).catch(_offline => {
                toast = "Text has not been downloaded offline. Going to catalog."
                setTimeout(() => {
                    goto('/catalog')   
                }, 2000);
                return undefined
            })
        }
        
        if (doc) $loadingTask = false;
        $currentTask = doc
        
        
        solutionText = doc?.title?.translations[$nativeLang] + '\n\n' + doc?.text?.translations[$nativeLang]


        if (!restoreScrollPosition) {            
            $currentlyScrolledParagraphIndex = 0
        }

        try {         
            const [srWords_l, newForms_l] = $username ? await getUserTaskStats($targetLang.shortcode, (String)(doc?.docId)) : [["ornage"], Object.values(doc?.title?.tokens).map(tok => tok.word).concat(Object.values(doc?.title?.tokens).map(tok => tok.word))]
            srWords = new Set(srWords_l)
            nNewForms = newForms_l.length
        } catch (_offline) {
            srWords = undefined
            nNewForms = undefined
        }
    }

    function initChatHistory() {
        $inlineChatHistory = $currentTask?.question?.text ? [{role: 'assistant', content: DocumentC.partialDocument($currentTask?.question?.text, $currentTask?.lang, $currentTask?.question?.translations, $currentTask?.question?.tokens)}] : [];
    }

</script>

{#if !$username}
    <strong>In this demo text, you learn the fabulous <em>Drnuk</em> language (and how this app works).</strong> <!-- If you want to dive right in with Polish, create an account at the bottom.-->
{/if}
<ReaderComponent tts={tts} solutionText={solutionText} taskVisible={!$loadingTask} srWords={srWords} bind:this={readerComponent}>
    <span slot="afterTask" hidden={!$currentTask}><ChatComponent readerComponent={readerComponent} inline={true} chatBoxTitle="Twoja odpowiedź 🤙" chatHistory={inlineChatHistory} srWords={srWords} trySpeak={tts?.trySpeak}/></span>
    <span slot="afterSolution"><ChatComponent readerComponent={readerComponent} inline={true} chatBoxTitle={undefined} chatHistory={inlineChatHistory} translationLang='en'/></span>
</ReaderComponent>
<button id="answbtn" class:loading={$loadingTask} on:click={onAnswbtnClick}>
    {answbtnTxtWhileSolutionShown}
</button>
<ChatComponent readerComponent={readerComponent} inline={false} chatBoxTitle="Ask me ✨"/>
<Toast message={toast} textReject={textRejectToast} onReject={() => {
    $failedWords = new Set();
    $inlineChatHistory = [];
    if (redirectedGame) {
        $currentGameId = redirectedGame;
        goto('/game')
    } else {
        location.reload();
    }
}}/>
<SuccessPopup message={congratsMessage} onClose={()=>{congratsMessage = undefined; statsClosedPromiseResolve()}}/>
