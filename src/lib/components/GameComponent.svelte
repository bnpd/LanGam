<script lang="ts" defer>
    import { onMount } from 'svelte';
    import ReaderComponent from './ReaderComponent.svelte';
    import { completeLevel, getPlayer, getPlayerLevel, getUserLang, updatePlayer } from './backend';
    import { username, nativeLang, targetLang, isSoundOn, currentTask, failedWords, currentlyScrolledParagraphIndex, loadingTask, gameChatHistory, player, chatOutcome, currentGameId, inlineChatHistory, morphHighlightFilter } from '$lib/stores';
	import { goto } from '$app/navigation';
	import Toast from './Toast.svelte';
	import ChatComponent from './ChatComponent.svelte';
	import SuccessPopup from './SuccessPopup.svelte';
	import DocumentC from '$lib/DocumentC';
	import type TtsComponent from './TtsComponent.svelte';
	import PowersComponent from './PowersComponent.svelte';
	import TooltipComponent from './TooltipComponent.svelte';
	import DictionaryComponent from './DictionaryComponent.svelte';
	import GrammarBookComponent from './GrammarBookComponent.svelte';

    const TOAST_REDIRECTED_SAVED_TASK = "Your selected text has been queued cause you have a saved game level."
    const TEXT_REJECT_SAVED_TASK = "Discard saved"
    const DEFAULT_CONGRATS_MESSAGE = 'Well done, keep up the pace!'
    const DEFAULT_CONGRATS_TITLE = 'Level complete 🙌'

    const UNKNOWN_POS = 0
    const STUDIED_POS = new Set([UNKNOWN_POS, 84, 86, 92, 93, 100])
    const TRACKED_POS = new Set([...STUDIED_POS, 85, 87, 89, 90, 91, 94, 95, 98])

    export let tts: TtsComponent;

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
    let grammarChapter: string | undefined

    onMount(async () => {
        if (!$username) {
            goto('/signup')
        }
        if (!$player?.id) {
            
            $currentGameId = $currentGameId ?? new URLSearchParams(window.location.search).get('gameId')
            if (!$currentGameId) {
                goto('/games')
                return
            } else {
                console.log('no player');
                $player = await getPlayer($currentGameId)
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

    async function onAnswbtnClick(outcome: string) {
        speechSynthesis.cancel()

        let completeLevelPromise = completeLevel($player.id, $currentTask.docId, outcome)

        statsClosedPromise = new Promise<boolean>((resolve, reject) => {
            statsClosedPromiseResolve = resolve
        })
        console.log(outcome);   
        console.log($currentTask?.outcomes);        
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
        showGameChatSuggestions = false

        grammarChapter = level.expand?.grammar
        $morphHighlightFilter = level.expand?.grammar?.morphHighlightFilter
        console.log(grammarChapter);
        

        // the following calculation of new word count runs async in the background
        getUserLang($username, $targetLang.id).then(user_lang => {
            const prev_seen_words = new Set(Object.keys(user_lang.seen_words))
            let new_forms = new Set(Object.values(doc?.title?.tokens).concat(Object.values(doc?.text?.tokens).concat(Object.values(doc?.question?.tokens)))
                            .filter(tok => TRACKED_POS.has(tok.pos))
                            .map(tok => tok.lemma_))
            new_forms = new_forms.difference(prev_seen_words)            
            nNewForms = new_forms.size
        }).catch(_offline => {
            nNewForms = undefined
        })
    }

    function initChatHistory() {
        $gameChatHistory = $currentTask?.question?.text ? [{role: 'assistant', content: DocumentC.partialDocument($currentTask?.question?.text, $currentTask?.lang, $currentTask?.question?.translations, $currentTask?.question?.tokens)}] : [];
        $chatOutcome = !($gameChatHistory?.length) ? 'default' : null
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

<ReaderComponent tts={tts} solutionText={solutionText} taskVisible={!$loadingTask} srWords={new Set()} bind:this={readerComponent}>
    <span slot="afterTask" hidden={!$currentTask}>{#if $gameChatHistory?.length}<ChatComponent readerComponent={readerComponent} inline={true} chatBoxTitle="Twoja odpowiedź 🤙" chatHistory={gameChatHistory} srWords={new Set()} trySpeak={tts?.trySpeak} isGame={true} showGameChatSuggestions={showGameChatSuggestions}/>{/if}</span>
    <span slot="afterSolution">{#if $gameChatHistory?.length}<ChatComponent readerComponent={readerComponent} inline={true} chatBoxTitle={undefined} chatHistory={gameChatHistory} translationLang='en' isGame={true}/>{/if}</span>
</ReaderComponent>
<div style="margin: auto; display: flex; flex-direction: row; width: 100%;">
    <input type="text" placeholder="Case/Aspect/Voice/Tense=/Number=" bind:value={$morphHighlightFilter} style="flex-grow: 1; width: 1px;">&nbsp;
    {#if grammarChapter}
        <GrammarBookComponent content={grammarChapter}/>
    {/if}
    <button class="gameNavBtn" class:loading={$loadingTask} on:click={onLevelBackbtnClick} hidden={!$player?.level_history?.order?.length}>
        ◀
    </button>
    <PowersComponent on:use_power={e => usePower(e.detail.power)}/>
    {#each (Object.entries($currentTask?.outcomes ?? {})) as [outcome, obj]}
        {#if $player?.level_history?.[obj.goto] || $chatOutcome == outcome}
            <button class="gameNavBtn" class:loading={$loadingTask} on:click={()=>onAnswbtnClick(outcome)}>
                ▶
            </button>
        {:else}
            <div style="display: inline-block;">
                <TooltipComponent>
                    <button class="gameNavBtn" slot="anchor">🔒</button>
                    <span slot="tooltip">There is a hidden outcome here that you can unlock by chatting with {$currentTask.character}</span>
                </TooltipComponent>
            </div>
        {/if}
    {/each}
</div>
<ChatComponent readerComponent={readerComponent} inline={false} chatBoxTitle="AI tutor - ask me anything ✨"/>
<Toast message={toast} textReject={textRejectToast} onReject={() => {
    $currentGameId = undefined;
    $failedWords = new Set();
    $gameChatHistory = [];
    goto('/read?doc='+redirectedDoc);
}}/>
<SuccessPopup title={congratsTitle} message={congratsMessage} footnote={nNewForms ? `You just encountered ${nNewForms} new words!\n` : ''} onClose={()=>{congratsMessage = undefined; congratsTitle = undefined; statsClosedPromiseResolve()}}/>
<DictionaryComponent/>
