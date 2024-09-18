<script lang="ts" defer>
    import { onMount } from 'svelte';
    import ReaderComponent from './ReaderComponent.svelte';
    import { completeLevel, getPlayer, getPlayerLevel, getUserTaskStats, sendReview, updatePlayer } from './backend';
    import { user, nativeLang, targetLang, isSoundOn, currentTask, reviews, failedWords, reviewDocIds, currentlyScrolledParagraphIndex, loadingTask, gameChatHistory, player, chatOutcome } from '$lib/stores';
	import { goto } from '$app/navigation';
	import Toast from './Toast.svelte';
	import ChatComponent from './ChatComponent.svelte';
	import SuccessPopup from './SuccessPopup.svelte';
	import DocumentC from '$lib/DocumentC';
	import type TtsComponent from './TtsComponent.svelte';

    const answbtnTxtWhileSolutionShown = "Continue"

    export let tts: TtsComponent;

    let solutionText = ''
    let toast: string | undefined;
    let readerComponent: ReaderComponent;
    let srWords: Set<string> | undefined;
    let nNewForms: number | undefined;
    let congratsTitle: string | undefined;
    let congratsMessage: string | undefined;
    let statsClosedPromise: Promise<boolean>;
    let statsClosedPromiseResolve: Function;
    let reviewsSentPromise: Promise<undefined>;

    onMount(async () => {
        if (!$user) {
            $targetLang = 'pl'
            $nativeLang = 'en'
            $isSoundOn = false
        }

                
        if ($failedWords.size > 0 || $gameChatHistory.length > 1) {
            // we have a saved state from last session to restore
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
        } else {
            await nextTask(); 
            initChatHistory();
        }
    })

    async function onAnswbtnClick () {
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

        // reviewsSentPromise = sendPendingReviews()
        let completeLevelPromise
        if (!$gameChatHistory.length) {
            completeLevelPromise = completeLevel($player.id, $currentTask.docId, "default")
        }

        statsClosedPromise = new Promise<boolean>((resolve, reject) => {
            statsClosedPromiseResolve = resolve
        })
        console.log($chatOutcome);
        console.log($currentTask?.outcomes);        
        congratsMessage = $currentTask?.outcomes?.[$chatOutcome]?.text ?? 'Keep going.'
        congratsTitle = $currentTask?.outcomes?.[$chatOutcome]?.title ?? 'Well done, student!'

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
            
            $player = (await completeLevelPromise).player
        } catch (rejection) {
            console.error(rejection);
            
            toast = "Offline. Your data was saved."
            setTimeout(() => {
                goto('/catalog')
            }, 1500);
            return
        }
        
        if ($user) {
            await nextTask() // IMPROVEMENT: we could even pre-fetch the next task while stats popup is shown
            initChatHistory()
        } else {
            goto('/signup')
        }
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
        let doc        
        if (!$user) { //anonymous mode
            doc = DocumentC.getSampleDoc()
        } else {
            if (!$player) {
                $player = await getPlayer($targetLang, '4sdspc36rwuf05e') //TODO: remove hardcoded gameId
            }
            const level = (await getPlayerLevel($player.id).catch(_offline => {
                toast = "Text has not been downloaded offline. Going to catalog."
                setTimeout(() => {
                    goto('/catalog')
                }, 2000);
                return undefined
            }))
            $player.level = level.seq_id

            doc = level?.['level']
            doc.docId = level.seq_id
        }
        
        if (doc) $loadingTask = false;
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

    function initChatHistory() {
        $gameChatHistory = $currentTask?.question?.text ? [{role: 'assistant', content: DocumentC.partialDocument($currentTask?.question?.text, $currentTask?.lang, $currentTask?.question?.translations, $currentTask?.question?.tokens)}] : [];
        $chatOutcome = !($gameChatHistory?.length) ? 'default' : null
    }

</script>

{#if !$user}
    <strong>In this demo text, you learn the fabulous <em>Drnuk</em> language (and how this app works).</strong> <!-- If you want to dive right in with Polish, create an account at the bottom.-->
{/if}
<ReaderComponent tts={tts} solutionText={solutionText} taskVisible={!$loadingTask} srWords={srWords} bind:this={readerComponent}>
    <span slot="afterTask" hidden={!$currentTask}>{#if $gameChatHistory?.length}<ChatComponent readerComponent={readerComponent} inline={true} chatBoxTitle="Twoja odpowiedź 🤙" chatHistory={gameChatHistory} srWords={srWords} trySpeak={tts?.trySpeak} isGame={true}/>{/if}</span>
    <span slot="afterSolution">{#if $gameChatHistory?.length}<ChatComponent readerComponent={readerComponent} inline={true} chatBoxTitle={undefined} chatHistory={gameChatHistory} translationLang='en' isGame={true}/>{/if}</span>
</ReaderComponent>
<button id="levelBackbtn" class:loading={$loadingTask} on:click={onLevelBackbtnClick} hidden={!$player?.level_history}>
    Back
</button>
<button id="answbtn" class:loading={$loadingTask} on:click={onAnswbtnClick} hidden={!$chatOutcome}>
    {answbtnTxtWhileSolutionShown}
</button>
<ChatComponent readerComponent={readerComponent} inline={false} chatBoxTitle="Ask me ✨"/>
<Toast message={toast} />
<SuccessPopup title={congratsTitle} message={congratsMessage} onClose={()=>{congratsMessage = undefined; congratsTitle = undefined; statsClosedPromiseResolve()}}/>
