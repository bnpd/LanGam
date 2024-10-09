<script lang="ts" defer>
    import { onMount } from 'svelte';
    import ReaderComponent from './ReaderComponent.svelte';
    import { completeLevel, getPlayer, getPlayerLevel, getUserTaskStats, refreshPlayer, updatePlayer } from './backend';
    import { user, nativeLang, targetLang, isSoundOn, currentTask, reviews, failedWords, reviewDocIds, currentlyScrolledParagraphIndex, loadingTask, gameChatHistory, player, chatOutcome, currentGameId, inlineChatHistory } from '$lib/stores';
	import { goto } from '$app/navigation';
	import Toast from './Toast.svelte';
	import ChatComponent from './ChatComponent.svelte';
	import SuccessPopup from './SuccessPopup.svelte';
	import DocumentC from '$lib/DocumentC';
	import type TtsComponent from './TtsComponent.svelte';
	import PowersComponent from './PowersComponent.svelte';

    const TOAST_REDIRECTED_SAVED_TASK = "Your selected text has been queued cause you have a saved game level."
    const TEXT_REJECT_SAVED_TASK = "Discard saved"
    const DEFAULT_CONGRATS_MESSAGE = 'Well done, keep up the pace!'
    const DEFAULT_CONGRATS_TITLE = 'Level complete 🙌'

    export let tts: TtsComponent;

    let solutionText = ''
    let toast: string | undefined;
    let textRejectToast: string | undefined;
    let readerComponent: ReaderComponent;
    let srWords: Set<string> | undefined;
    let nNewForms: number | undefined;
    let congratsTitle: string | undefined;
    let congratsMessage: string | undefined;
    let statsClosedPromise: Promise<boolean>;
    let statsClosedPromiseResolve: Function;
    let reviewsSentPromise: Promise<undefined>;
    let redirectedDoc: string | null

    onMount(async () => {
        if (!$user) {
            goto('/signup')
        }
        if (!$player) {
            
            $currentGameId = $currentGameId ?? new URLSearchParams(window.location.search).get('gameId')
            if (!$currentGameId) {
                goto('/games')
                return
            } else {
                console.log('no player');
                $player = await getPlayer($targetLang, $currentGameId)
                console.log($player);
            }
        }
                
        if ($failedWords.size > 0 || $gameChatHistory.length > 1 || $inlineChatHistory.length > 1) {
            // we have a saved state from last session to restore
            if(!$currentGameId) { // but it doesn't belong to a game, so redirect
                const urlGameId = new URLSearchParams(window.location.search).get('gameId')
                goto('/read' + (urlGameId ? `?redirectedGame=${urlGameId}` : ''));
                return
            }

            await nextTask(true);

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

            redirectedDoc = new URLSearchParams(window.location.search).get('redirectedDoc')

            if (redirectedDoc) {
                toast = TOAST_REDIRECTED_SAVED_TASK;
                textRejectToast = TEXT_REJECT_SAVED_TASK
            }
        } else {
            await nextTask(); 
            initChatHistory();
        }
    })

    async function onAnswbtnClick () {
        speechSynthesis.cancel()

        const correctedWords = (srWords?.difference($failedWords))?.size // this is kinda cheating cause srWords are lemmas and failedWords are forms, but it's not easily fixable without saving the whole Token object somewhere

        if ($currentTask) {
            $reviews.push(structuredClone($failedWords))
            $reviews = $reviews
            $reviewDocIds.push($currentTask.docId)
            $reviewDocIds = $reviewDocIds
            $failedWords.clear()
            $failedWords = $failedWords
        }

        // reviewsSentPromise = sendPendingReviews()
        let completeLevelPromise
        if (!$gameChatHistory.length) {
            completeLevelPromise = completeLevel($player.id, $currentTask.docId, "default")
        } else {
            completeLevelPromise = refreshPlayer($player.id)
        }

        statsClosedPromise = new Promise<boolean>((resolve, reject) => {
            statsClosedPromiseResolve = resolve
        })
        console.log($chatOutcome);
        console.log($currentTask?.outcomes);        
        congratsMessage = $currentTask?.outcomes?.[$chatOutcome]?.text ?? DEFAULT_CONGRATS_MESSAGE
        congratsTitle = $currentTask?.outcomes?.[$chatOutcome]?.title ?? DEFAULT_CONGRATS_TITLE

        await statsClosedPromise

        $currentTask = undefined
        solutionText = ''
        $loadingTask = true

        // try {
        //     await reviewsSentPromise
        // } catch (rejection) {
        //     toast = "Offline. Your data was saved."
        //     setTimeout(() => {
        //         goto('/catalog')
        //     }, 1500);
        //     return
        // }

        try {
            console.log(player);
            
            $player = await completeLevelPromise
        } catch (rejection) {
            console.error(rejection);
            
            toast = "Offline. Your data was saved."
            setTimeout(() => {
                goto('/catalog')
            }, 1500);
            return
        }
        
        await nextTask() // IMPROVEMENT: we could even pre-fetch the next task while stats popup is shown
        initChatHistory()

    }

    async function onLevelBackbtnClick() {
        let prevLevelSeqId = $player.level_history.order.pop()
        $player.level = prevLevelSeqId
        $player.stats = $player.level_history[prevLevelSeqId].stats
        $player.powers = $player.level_history[prevLevelSeqId].powers
        await updatePlayer($player)
        await nextTask()
        initChatHistory()
    }

    // /**
    //  * Send queued reviews to backend
    //  * @returns {Promise<unknown>} Promise that is resolved when send was successful or rejected if offline
    //  */
    // async function sendPendingReviews(){
    //     const times = $reviewDocIds.length
    //     for (let i = 0; i < times; i++) {
    //         try {
    //             await sendReview($targetLang, $reviewDocIds[0], Array.from($reviews[0]))            
    //         } catch (offlineError) {
    //             return Promise.reject(offlineError)
    //         }
            
    //         $reviews.shift()
    //         $reviews = $reviews
    //         $reviewDocIds.shift()
    //         $reviewDocIds = $reviewDocIds 
    //     }
    //     return 
    // }


    async function nextTask(restoreScrollPosition: boolean = false){
        const level = (await getPlayerLevel($player.id).catch(_offline => {
            toast = "Text has not been downloaded offline. Going to catalog."
            setTimeout(() => {
                goto('/catalog')
            }, 2000);
            return undefined
        }))
        $player.level = level.seq_id

        let doc = level?.['level']
        doc.docId = level.seq_id
        
        if (doc) $loadingTask = false;
        $currentTask = doc
        
        
        solutionText = doc?.title?.translations[$nativeLang] + '\n\n' + doc?.text?.translations[$nativeLang]


        if (!restoreScrollPosition) {            
            $currentlyScrolledParagraphIndex = 0
        }

        try {         
            const [srWords_l, newForms_l] = await getUserTaskStats($targetLang, (String)(doc?.docId))
            srWords = new Set(srWords_l)
            nNewForms = newForms_l.length
        } catch (_offline) {
            srWords = undefined
            nNewForms = undefined
        }
    }

    function initChatHistory() {
        $gameChatHistory = $currentTask?.question?.text ? [{role: 'assistant', content: DocumentC.partialDocument($currentTask?.question?.text, $currentTask?.lang, $currentTask?.question?.translations, $currentTask?.question?.tokens)}] : [];
        $chatOutcome = !($gameChatHistory?.length) ? 'default' : null
    }

</script>

<ReaderComponent tts={tts} solutionText={solutionText} taskVisible={!$loadingTask} srWords={srWords} bind:this={readerComponent}>
    <span slot="afterTask" hidden={!$currentTask}>{#if $gameChatHistory?.length}<ChatComponent readerComponent={readerComponent} inline={true} chatBoxTitle="Twoja odpowiedź 🤙" chatHistory={gameChatHistory} srWords={srWords} trySpeak={tts?.trySpeak} isGame={true}/>{/if}</span>
    <span slot="afterSolution">{#if $gameChatHistory?.length}<ChatComponent readerComponent={readerComponent} inline={true} chatBoxTitle={undefined} chatHistory={gameChatHistory} translationLang='en' isGame={true}/>{/if}</span>
</ReaderComponent>
<div style="margin: auto">
    <button id="levelBackbtn" class:loading={$loadingTask} on:click={onLevelBackbtnClick} hidden={!$player?.level_history?.order?.length}>
        ◀
    </button>
    <PowersComponent />
    <button id="answbtn" class:loading={$loadingTask} on:click={onAnswbtnClick} hidden={!$chatOutcome}>
        ▶
    </button>
</div>
<ChatComponent readerComponent={readerComponent} inline={false} chatBoxTitle="Ask me ✨"/>
<Toast message={toast} textReject={textRejectToast} onReject={() => {
    $currentGameId = undefined;
    $failedWords = new Set();
    $gameChatHistory = [];
    goto('/read?doc='+redirectedDoc);
}}/>
<SuccessPopup title={congratsTitle} message={congratsMessage} onClose={()=>{congratsMessage = undefined; congratsTitle = undefined; statsClosedPromiseResolve()}}/>
