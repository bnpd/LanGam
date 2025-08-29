<script lang="ts" defer>
    import { onMount } from 'svelte';
    import ReaderComponent from './ReaderComponent.svelte';
    import { completeLevel, completeLevelAnon, getLevel, getPlayer, getPlayerLevel, getUserLang, updatePlayer } from './backend';
    import { username, currentTask, currentSolution, currentlyScrolledParagraphIndex, loadingTask, gameChatHistory, player, chatOutcome, currentGameId, morphHighlightFilter, currentTaskNParagraphs, desiredSimplificationLevel, actualSimplificationLevel, nativeLang } from '$lib/stores';
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
    import QuizComponent from './QuizComponent.svelte';
    import { page } from '$app/stores';    const DEFAULT_CONGRATS_MESSAGE = 'Well done!'
    const DEFAULT_CONGRATS_TITLE = 'Level complete 🙌'

    const UNKNOWN_POS = 0
    const STUDIED_POS = new Set([UNKNOWN_POS, 84, 86, 92, 93, 100])
    const TRACKED_POS = new Set([...STUDIED_POS, 85, 87, 89, 90, 91, 94, 95, 98])

    $: fallbackGameId = $page.data?.gameId;

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

    let readerComponent: ReaderComponent;
    let nNewForms: number | undefined;
    let congratsTitle: string | undefined;
    let congratsMessage: string | undefined;
    let statsClosedPromise: Promise<boolean>;
    let statsClosedPromiseResolve: Function;
    let showGameChatSuggestions: boolean = false;
    let grammarChapter: { title_en: string; text_en: string; } | undefined
    let showTutorChat: boolean = false
    let lockedLevelToast: string | undefined
    let finishedGame = false
    let showSignupPrompt = false

    $: if($currentlyScrolledParagraphIndex >= $currentTaskNParagraphs-1){
        window.umami?.track('Scroll 100%');
    }

    onMount(async () => {
        if (!$username && !$player) { // new user, not logged in -> trial mode
            $player = GET_ANON_PLAYER($currentGameId ?? new URLSearchParams(window.location.search).get('gameId') ?? fallbackGameId)
            await prevTask($player.level);
            return
        }
        
        if ($username && !$player?.id) { // user is logged in, but does not have a player for this game yet
            // load gameId from URL if not set
            $currentGameId = $currentGameId ?? new URLSearchParams(window.location.search).get('gameId') ?? fallbackGameId

            $player = await getPlayer($currentGameId, $player)
        }
                
        await nextTask();
    })

    async function onAnswbtnClick(outcome: string) {
        speechSynthesis?.cancel()
        statsClosedPromise = new Promise<boolean>((resolve, reject) => {
            statsClosedPromiseResolve = resolve
        })

        let completeLevelPromise
        if ($player.level == $currentTask.docId) { // player needs to be leveled up
            completeLevelPromise = $username ? 
                completeLevel($player.id, $currentTask.docId, outcome)
                : completeLevelAnon($player, $currentTask.docId, outcome)
        } else { // player has alrready been leveled up by chat, just resolve the promise
            completeLevelPromise = Promise.resolve($player)
        }

        
        congratsMessage = $currentTask?.outcomes?.[outcome]?.text ?? DEFAULT_CONGRATS_MESSAGE
        congratsTitle = $currentTask?.outcomes?.[outcome]?.title ?? DEFAULT_CONGRATS_TITLE

        await statsClosedPromise

        $currentTask = undefined
        $loadingTask = true
        $gameChatHistory = []
        $chatOutcome = null

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
    }

    async function onLevelBackbtnClick() {
        speechSynthesis?.cancel()
        let prevLevelSeqId = $player.level_history.order.pop()
        $player.level = prevLevelSeqId
        $player.stats = $player.level_history[prevLevelSeqId].stats
        $player.powers = $player.level_history[prevLevelSeqId].powers
        if ($username) updatePlayer($player) // this can just happen async (if it fails it would give room for cheating/frustration though)
        await prevTask(prevLevelSeqId)
    }

    async function prevTask(seqId: number) { // like next task but only with the things necessary when moving back to previous level where we already know seqId
        finishedGame = false
        $loadingTask = true
        const {level, translations, actualSimplificationLevel} = await getLevel($player.game, seqId, $nativeLang, $desiredSimplificationLevel)
        $actualSimplificationLevel = actualSimplificationLevel
        level.docId = level.seq_id
        if (level) $loadingTask = false;
        $currentTask = level
        if (translations) $currentSolution = translations.find(t => t.field === 'title')?.text + '\n\n' + translations.find(t => t.field === 'text')?.text
        $currentlyScrolledParagraphIndex = 0
        showGameChatSuggestions = level.docId < 3 // show chat suggestions for first chat
        grammarChapter = level.expand?.grammar
        $morphHighlightFilter = level.expand?.grammar?.morphHighlightFilter
        initChatHistory(translations?.find(t => t.field === 'question')?.text)
    }

    async function nextTask(){
        console.log('nextTask', $player.level, $desiredSimplificationLevel, $nativeLang, $username);
        
        let level, translations
        try {
            let res = $username ?
              await getPlayerLevel($player.id, $nativeLang, $desiredSimplificationLevel)
            : await getLevel(fallbackGameId, $player.level, $nativeLang, $desiredSimplificationLevel);
            level = res.level
            translations = res.translations
            $actualSimplificationLevel = res.actualSimplificationLevel
        } catch (error) {
            if (error.status == 404) {
                finishedGame = true
                $loadingTask = false
                return
            }
            toast = "Cannot connect to the internet."
            return
        }
        $player.level = level.seq_id

        level.docId = level.seq_id
        
        if (level) $loadingTask = false;
        $currentTask = level
        if (translations) $currentSolution = translations.find(t => t.field === 'title')?.text + '\n\n' + translations.find(t => t.field === 'text')?.text

        if ($gameChatHistory.length > 1 && !$chatOutcome) {
            // we have a saved state from last session to restore
            $currentlyScrolledParagraphIndex = 0
        } else {
            initChatHistory(translations?.find(t => t.field === 'question')?.text)
        }
        showGameChatSuggestions = level.docId < 3 // show chat suggestions for first chat

        grammarChapter = level.expand?.grammar
        $morphHighlightFilter = level.expand?.grammar?.morphHighlightFilter

        if (!$username && $player?.level_history?.order?.length % 2 === 0 && $player?.level_history?.order?.length > 0) { // show the signup prompt at third, fifth, etc. level
            // player advanced two levels, time to consider signing up
            showSignupPrompt = true
            window.umami?.track('Signup Prompt shown')
        }

        // the following calculation of new word count runs async in the background if the player stays for more than 5 seconds on the level
        const docIdBeforeMaybeNavigateToDifferentLevel = $currentTask?.docId
        setTimeout(async () => {
            if ($username && $currentTask?.docId === docIdBeforeMaybeNavigateToDifferentLevel) {
                const user_lang = await getUserLang($username, $page.data?.targetLang.id).catch(_offline => {
                    nNewForms = undefined
                })
                if (!user_lang?.seen_words) return
                const prev_seen_words = new Set(Object.keys(user_lang.seen_words))
                let new_forms = new Set(Object.values(level?.title?.tokens).concat(Object.values(level?.text?.tokens).concat(Object.values(level?.question?.tokens)))
                                .filter((tok: any) => TRACKED_POS.has(tok.pos))
                                .map((tok: any) => tok.lemma_))
                new_forms = new_forms.difference(prev_seen_words)            
                nNewForms = new_forms.size
            }
        }, 5000);
    }

    function initChatHistory(firstMsgTranslation: string | undefined = undefined) {
        $gameChatHistory = $currentTask?.question?.text ? [{role: 'assistant', content: DocumentC.partialDocument($currentTask?.question?.text, $currentTask?.lang, firstMsgTranslation, $currentTask?.question?.tokens)}] : [];
        $chatOutcome = null
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
    <ReaderComponent srWords={new Set()} bind:this={readerComponent}>
        <span slot="afterTask" hidden={!$currentTask}>
            {#if $gameChatHistory?.length}
                <ChatComponent readerComponent={readerComponent} inline={true} chatBoxTitle="Your turn 🤙" chatHistory={gameChatHistory} srWords={new Set()} showGameChatSuggestions={showGameChatSuggestions}/>
            {:else if $currentTask?.docId == 1} <!-- TODO: implement quiz for later levels -->
                <QuizComponent on:points={(e) => {
                    $currentTask.outcomes["default"].text = "You've earned " + e.detail.points + " points!\n" + DEFAULT_CONGRATS_TITLE;
                    $currentTask.outcomes["default"].title = "Correct!";
                    onAnswbtnClick("default")
                }} />
            {/if}
        </span>
        <span slot="afterSolution">
            {#if $gameChatHistory?.length}
                <ChatComponent readerComponent={readerComponent} inline={true} chatBoxTitle={undefined} chatHistory={gameChatHistory} translationLang={$nativeLang}/>
            {/if}
        </span>
    </ReaderComponent>
{/if}
<div style="text-align: center;">
    <!--<input type="text" name="e" id="e" bind:value={$morphHighlightFilter} style:width="5em">-->
    {#if grammarChapter && !finishedGame}
        <GrammarBookComponent content={grammarChapter}/>
    {/if}
    <button class="gameNavBtn nav-back" disabled={$loadingTask} on:click={onLevelBackbtnClick} hidden={!$player?.level_history?.order?.length}>
        ◀
    </button>
    {#if !finishedGame}
        <PowersComponent on:use_power={e => usePower(e.detail.power)}/>
        {#each (Object.entries($currentTask?.outcomes ?? {})) as [outcome, obj]}
            {#if outcome == 'default' || $player?.level_history?.[obj.goto] || $chatOutcome == outcome} <!--TODO: fix if there are two outcomes with same seq_id -->
                <button class="gameNavBtn nav-forward" class:flash={$currentlyScrolledParagraphIndex >= $currentTaskNParagraphs-1} disabled={$loadingTask} on:click={()=>onAnswbtnClick(outcome)} data-umami-event="Forward Button" data-umami-event-level={$currentTask?.docId}>
                    ▶
                </button>
            {:else}
                <div style="display: inline-block;">
                    <button 
                        class="gameNavBtn nav-locked" 
                        on:click={()=>{
                            readerComponent.scrollToBottom();
                            if (document.querySelector('.nav-forward')) {
                                lockedLevelToast=`There is a hidden chat outcome here that you can unlock by talking with ${$currentTask.character}`
                            } else {
                                lockedLevelToast=`To unlock the next level, talk to ${$currentTask.character}`
                            }
                        }} 
                        data-umami-event="Forward Button (locked)"
                        data-umami-event-level={$currentTask?.docId}
                        style="position: relative;"
                    >
                        <span style="position: absolute; left: 5px; top: 5px; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; pointer-events: none;">
                            🔒
                        </span>
                        ▶
                    </button>
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
<Toast bind:message={lockedLevelToast}/>
<SuccessPopup 
    bind:title={congratsTitle} 
    bind:message={congratsMessage} 
    footnote={nNewForms ? `You just encountered ${nNewForms} new words!\n` : ''} 
    onClose={statsClosedPromiseResolve}
/>
<Popup closeButtonText="Later" bind:isOpen={showSignupPrompt} on:closed={() => {window.umami?.track('Signup Prompt dismissed')}}>
    <h1>📂 Save your progress!</h1>
	<p style="line-height: 200%; margin-bottom: 0.4em">Create a free account now.</p>
    <button on:click={()=>goto('/signup')} class="highlighted" data-umami-event="Signup Prompt accepted">Register</button>
</Popup>
<DictionaryComponent/>
