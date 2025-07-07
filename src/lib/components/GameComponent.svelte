<script lang="ts" defer>
    import { onMount } from 'svelte';
    import ReaderComponent from './ReaderComponent.svelte';
    import { completeLevel, getLevel, getPlayer, getPlayerLevel, getUserLang, updatePlayer } from './backend';
    import { username, nativeLang, targetLang, isSoundOn, currentTask, failedWords, currentlyScrolledParagraphIndex, loadingTask, gameChatHistory, player, chatOutcome, currentGameId, inlineChatHistory, morphHighlightFilter, currentTaskNParagraphs, simplificationLevel } from '$lib/stores';
	import { goto } from '$app/navigation';
	import Toast from './Toast.svelte';
	import ChatComponent from './ChatComponent.svelte';
	import SuccessPopup from './SuccessPopup.svelte';
	import DocumentC from '$lib/DocumentC';
	import PowersComponent from './PowersComponent.svelte';
	import DictionaryComponent from './DictionaryComponent.svelte';
	import GrammarBookComponent from './GrammarBookComponent.svelte';
	import WebPushSubscription from './WebPushSubscription.svelte';
	import Popup from './Popup.svelte';
    import { page } from '$app/stores';

    const TOAST_REDIRECTED_SAVED_TASK = "Your selected text has been queued cause you have a saved game level."
    const TEXT_REJECT_SAVED_TASK = "Discard saved"
    const DEFAULT_CONGRATS_MESSAGE = 'Well done, keep up the pace!'
    const DEFAULT_CONGRATS_TITLE = 'Level complete 🙌'

    const UNKNOWN_POS = 0
    const STUDIED_POS = new Set([UNKNOWN_POS, 84, 86, 92, 93, 100])
    const TRACKED_POS = new Set([...STUDIED_POS, 85, 87, 89, 90, 91, 94, 95, 98])
    // Remove hardcoded fallback IDs
    // const FALLBACK_GAME_ID = '4sdspc36rwuf05e'
    // const ANON_LANG = {
    //     id: 'mmgox8wdjtvp7uw',
    //     shortcode: 'PL',
    //     name: 'Polish',
    //     learnable: true
    // }
    // Instead, use values from $page.data
    $: fallbackGameId = $page.data?.gameId;
    $: anonLang = $page.data?.lang;

    function GET_ANON_PLAYER(gameId: string){return {
        "collectionId": $page.data?.collectionId,
        "collectionName": "players",
        "created": "1970-01-01 00:00:00.000Z",
        "game": gameId,
        "id": null,
        "level": 1,
        "level_history": {},
        "powers": {},
        "stats": {},
        "updated": "1970-01-01 00:00:00.000Z",
        "user_lang": null
    }}

    let solutionText = ''
    let toast: string | undefined;
    let textRejectToast: string | undefined;
    let readerComponent: ReaderComponent;
    let nNewForms: number | undefined;
    let congratsTitle: string | undefined;
    let congratsMessage: string | undefined;
    let statsClosedPromise: Promise<boolean>;
    let statsClosedPromiseResolve: Function;
    let redirectedDoc: string | null
    let showGameChatSuggestions: boolean = false;
    let grammarChapter: { title_en: string; text_en: string; } | undefined
    let showTutorChat: boolean = false
    let lockedLevelToast: string | undefined
    let finishedGame = false
    let showSignupPrompt = false

    $: if($currentlyScrolledParagraphIndex >= $currentTaskNParagraphs-1) try {umami.track('Scroll 100%')} catch (_undef) {}

    onMount(async () => {
        if (!$username) { // new user, not logged in -> trial mode
            //goto('/signup')
            $player = GET_ANON_PLAYER($currentGameId ?? new URLSearchParams(window.location.search).get('gameId') ?? fallbackGameId)
            $targetLang = anonLang
            $nativeLang = 'en'
            await prevTask($player.level); 
            initChatHistory();
            return
        } 
        
        // user is logged in
        if (!$player?.id) { // but does not have a player for this game yet
            $currentGameId = $currentGameId ?? new URLSearchParams(window.location.search).get('gameId')
            if (!$currentGameId) {
                goto('/games')
                return
            }

            $player = await getPlayer($currentGameId)
            if ($player.level == 1 && new URLSearchParams(window.location.search).get('advanceLevelAfterSignup') == 'true') {
                $player = await completeLevel($player.id, $player.level, 'default')
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

    async function onAnswbtnClick(outcome: string) {
        speechSynthesis?.cancel()
        statsClosedPromise = new Promise<boolean>((resolve, reject) => {
            statsClosedPromiseResolve = resolve
        })

        if (!$username) {
            showSignupPrompt = true
            try {umami.track('Signup Prompt shown')} catch (_undef) {}
            return
        }

        let completeLevelPromise = completeLevel($player.id, $currentTask.docId, outcome)
        
        congratsMessage = $currentTask?.outcomes?.[outcome]?.text ?? DEFAULT_CONGRATS_MESSAGE
        congratsTitle = $currentTask?.outcomes?.[outcome]?.title ?? DEFAULT_CONGRATS_TITLE

        await statsClosedPromise

        $currentTask = undefined
        solutionText = ''
        $loadingTask = true

        try {
            $player = await completeLevelPromise
        } catch (rejection) {
            console.error(rejection);
            
            toast = "Offline. Your data was saved."
            // setTimeout(() => {
            //     goto('/catalog')
            // }, 1500);
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
        updatePlayer($player) // this can just happen async (if it fails it would give room for cheating/frustration though)
        await prevTask(prevLevelSeqId)
        initChatHistory()
    }

    async function prevTask(seqId: number) { // like next task but only with the things necessary when moving back to previous level where we already know seqId
        finishedGame = false
        $loadingTask = true
        const level = await getLevel($player.game, seqId, $simplificationLevel)
        let doc = level?.['level']
        doc.docId = level.seq_id
        if (doc) $loadingTask = false;
        $currentTask = doc
        solutionText = doc?.title?.translations[$nativeLang] + '\n\n' + doc?.text?.translations[$nativeLang]
        $currentlyScrolledParagraphIndex = 0
        showGameChatSuggestions = false
        grammarChapter = level.expand?.grammar
        $morphHighlightFilter = level.expand?.grammar?.morphHighlightFilter
    }

    async function nextTask(restoreScrollPosition: boolean = false){
        let level
        try {
            level = await getPlayerLevel($player.id, $simplificationLevel)
        } catch (error) {            
            if (error.status == 404) {
                finishedGame = true
                $loadingTask = false
                return
            }
            toast = "Cannot connect to the internet."
        }
        $player.level = level.seq_id

        let doc = level?.['level']
        doc.docId = level.seq_id
        
        if (doc) $loadingTask = false;
        $currentTask = doc
        
        solutionText = doc?.title?.translations[$nativeLang] + '\n\n' + doc?.text?.translations[$nativeLang]


        if (!restoreScrollPosition) {            
            $currentlyScrolledParagraphIndex = 0
        }
        showGameChatSuggestions = false

        grammarChapter = level.expand?.grammar
        $morphHighlightFilter = level.expand?.grammar?.morphHighlightFilter

        // the following calculation of new word count runs async in the background if the player stays for more than 5 seconds on the level
        const docIdBeforeMaybeNavigateToDifferentLevel = $currentTask?.docId
        setTimeout(async () => {
            if ($currentTask?.docId === docIdBeforeMaybeNavigateToDifferentLevel) {
                const user_lang = await getUserLang($username, $targetLang.id).catch(_offline => {
                    nNewForms = undefined
                })
                if (!user_lang?.seen_words) return
                const prev_seen_words = new Set(Object.keys(user_lang.seen_words))
                let new_forms = new Set(Object.values(doc?.title?.tokens).concat(Object.values(doc?.text?.tokens).concat(Object.values(doc?.question?.tokens)))
                                .filter((tok: any) => TRACKED_POS.has(tok.pos))
                                .map((tok: any) => tok.lemma_))
                new_forms = new_forms.difference(prev_seen_words)            
                nNewForms = new_forms.size
            }
        }, 5000);
    }

    function initChatHistory() {
        $gameChatHistory = $currentTask?.question?.text ? [{role: 'assistant', content: DocumentC.partialDocument($currentTask?.question?.text, $currentTask?.lang, $currentTask?.question?.translations, $currentTask?.question?.tokens)}] : [];
        $chatOutcome = !($gameChatHistory?.length) ? 'default' : null // if AI is NOT starting a chat with us, chatOutcome = default so that forward button is enabled
    }



	function usePower(power: string): void {
		switch (power) {
            case 'super_memory':
                showGameChatSuggestions = true
                break;
            default:
                console.error('Unknown power: '+power);
                break;
        }
	}
</script>

{#if finishedGame}
    <div class="card">
        <h3 style="text-align: center; margin: 0.5em 1em 2em 1em">Congrats on getting this far!</h3>
        LanGam's storyline will be finished very soon. <br><br>
        If you have any feedback, please hit the button at the bottom of the screen, I'd love to hear it. <br><br>
        Thanks for your patience 🥳<br>
        <WebPushSubscription>Notify me about new levels!</WebPushSubscription>
    </div>
{:else}
    <ReaderComponent solutionText={solutionText} srWords={new Set()} bind:this={readerComponent}>
        <span slot="afterTask" hidden={!$currentTask}>{#if $gameChatHistory?.length}<ChatComponent readerComponent={readerComponent} inline={true} chatBoxTitle="Twoja odpowiedź 🤙" chatHistory={gameChatHistory} srWords={new Set()} isGame={true} showGameChatSuggestions={showGameChatSuggestions}/>{/if}</span>
        <span slot="afterSolution">{#if $gameChatHistory?.length}<ChatComponent readerComponent={readerComponent} inline={true} chatBoxTitle={undefined} chatHistory={gameChatHistory} translationLang='en' isGame={true}/>{/if}</span>
    </ReaderComponent>
{/if}
<div style="text-align: center;">
    <!--<input type="text" name="e" id="e" bind:value={$morphHighlightFilter} style:width="5em">-->
    {#if grammarChapter && !finishedGame}
        <GrammarBookComponent content={grammarChapter}/>
    {/if}
    <button class="gameNavBtn" disabled={$loadingTask} on:click={onLevelBackbtnClick} hidden={!$player?.level_history?.order?.length}>
        ◀
    </button>
    {#if !finishedGame}
        <PowersComponent on:use_power={e => usePower(e.detail.power)}/>
        {#each (Object.entries($currentTask?.outcomes ?? {})) as [outcome, obj]}
            {#if $player?.level_history?.[obj.goto] || $chatOutcome == outcome} <!--TODO: fix if there are two outcomes with same seq_id -->
                <button class="gameNavBtn" class:flash={$currentlyScrolledParagraphIndex >= $currentTaskNParagraphs-1} disabled={$loadingTask} on:click={()=>onAnswbtnClick(outcome)} data-umami-event="Forward Button">
                    ▶
                </button>
            {:else}
                <div style="display: inline-block;">
                    <button 
                        class="gameNavBtn" 
                        on:click={()=>{
                            readerComponent.scrollToBottom();
                            lockedLevelToast=`There is a hidden outcome here that you can unlock by chatting with ${$currentTask.character}`
                        }} 
                        data-umami-event="Forward Button (locked)"
                    >🔒</button>
                </div>
            {/if}
        {/each}
        {#if !showTutorChat}
            <button style="position: absolute; right: var(--padding-x-body)" class="chat-circle-btn" on:click={()=>{showTutorChat = true}} data-umami-event="Tutor Chat opened"><b>
                🗨</b></button>
        {/if}        
    {/if}
</div>
<div hidden={!showTutorChat}>
    <ChatComponent bind:chatFocussed={showTutorChat} readerComponent={readerComponent} inline={false} chatBoxTitle="AI tutor - ask me anything ✨"/>
</div>
<Toast message={toast} textReject={textRejectToast} onReject={() => {
    $currentGameId = undefined;
    $failedWords = new Set();
    $gameChatHistory = [];
    goto('/read?doc='+redirectedDoc);
}}/>
<Toast bind:message={lockedLevelToast}/>
<SuccessPopup 
    bind:title={congratsTitle} 
    bind:message={congratsMessage} 
    footnote={nNewForms ? `You just encountered ${nNewForms} new words!\n` : ''} 
    onClose={statsClosedPromiseResolve}
/>
<Popup closeButtonText="I'm not done reading" bind:isOpen={showSignupPrompt} on:closed={() => {try {umami.track('Signup Prompt dismissed')} catch (_undef) {}}}>
    <h1>Thanks for trying the first chapter</h1>
	<p style="line-height: 200%; margin-bottom: 0.4em">📂 Save your progress!<br>Create a free account now.</p>
    <button on:click={()=>goto('/signup?advanceLevelAfterSignup=true')} class="highlighted" data-umami-event="Signup Prompt accepted">Sign up to continue</button>
</Popup>
<DictionaryComponent/>
