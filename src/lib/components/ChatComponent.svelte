<script lang="ts" defer>
	import { chatOutcome, currentTask, failedWords, nativeLang, player, targetLang, username } from "$lib/stores";
	import { tick } from "svelte";
	import BadgeComponent from "./BadgeComponent.svelte";
	import type ReaderComponent from "./ReaderComponent.svelte";
	import { sendChat, sendGameChat, sendTutorChat } from "./backend";
	import { writable, type Writable } from "svelte/store";
	import TaskComponent from "./TaskComponent.svelte";
	import DocumentC from "$lib/DocumentC";

    const ANON_RESPONSE = 'AI cannot help with the Drnuk language yet - but sign up to get help with Polish.'
    const MAX_LENGTH_RESPONSE = "This chat has reached it's maximum length. Try chatting about another text."
    const OTHER_ERROR_RESPONSE = 'Cannot connect, please try again'
    
    /**
     * @type {string | undefined}
     */
    $: lastFailed = Array.from($failedWords).at(-1);
    $: lastFailedLemma = lastFailed ? findLemma(lastFailed) : undefined
    $: if (typeof document !== 'undefined' && !inline) {            
            let mainContent = document?.getElementById('contentbox')
            if (mainContent) {
                mainContent.style.opacity = ($chatHistory.length && (chatFocussed || loading)) ? "0.2" : "1"
            }
        }
    
    export let readerComponent: ReaderComponent;
    export let inline: boolean;
    export let chatBoxTitle: string | undefined = undefined;
    export let chatHistory: Writable<{role: string, content: DocumentC}[]> = new writable([]);
    export let translationLang: string = 'original'
    export let srWords: Set<string> | undefined = undefined
    export let trySpeak: Function | undefined = undefined
    export let isGame: boolean = false
    export let showGameChatSuggestions: boolean = true
    let chatFocussed: boolean = false;
    let chatPrompt: string = ''
    let iChat: HTMLDivElement
    let loading: boolean = false
    let messageHistoryContainer: HTMLDivElement

    /**
     * Finds the first occurrence of word in the text and returns the corresponding lemma (thus not necessarily the lemma for that ocurrence that the user clicked)
     * @param word The word of which the lemma is wanted
     */
    function findLemma(word: string) {
        if (!word || !$currentTask?.text) return undefined
        for (const token of Object.values($currentTask.text.tokens)) {
            if ((token as any).word == word) {
                return (token as any).lemma_
            }
        }
    }

    function onClickChatSuggestion(e: Event) {
        chatPrompt = (e.currentTarget as HTMLButtonElement).innerText
        submitChat(true)
    }

    function onSubmitChatField(e: Event) {
        if (chatPrompt.length) {
            submitChat(false)
        } else {
            iChat?.focus()
        }
    }

    /**
     * Submit a chat to backend
     * @param partialContext whether to only send the currently visible paragraphs as context or whole doc (identified by docId). If global isGame is true, no context is sent.
     */
    async function submitChat(partialContext: boolean) {
        loading = true
        const newMessage = {role: 'user', content: DocumentC.partialDocument(chatPrompt, $targetLang.shortcode, undefined, undefined)}
        let new_history = $chatHistory
        try {
            let responseMsg
            if ($username) {
                let correction
                let response
                if (isGame) {
                    let end_conversation, outcome
                    ({end_conversation, outcome, correction, response} = await sendGameChat(messageHistoryForChatGpt($chatHistory.concat([newMessage])), $player.id, $player.level));
                    $chatOutcome = end_conversation ? outcome : null
                } else if (!inline) {
                    response = await sendTutorChat(messageHistoryForChatGpt($chatHistory.concat([newMessage])), readerComponent.getVisibleParagraphs())
                    console.log(response);
                    
                } else {
                    ({correction, response} = 
                        partialContext ? await sendChat(messageHistoryForChatGpt($chatHistory.concat([newMessage])), inline, undefined, undefined, readerComponent.getVisibleParagraphs())
                                       : await sendChat(messageHistoryForChatGpt($chatHistory.concat([newMessage])), inline, $targetLang.shortcode, $currentTask.docId, undefined));
                }
                if (correction) {
                    newMessage.content = correction // replace user's message with corrected message
                    if (isEdited(correction)) {
                        newMessage.role = 'correction'
                    }
                }
                (newMessage.content.text.translations ||= {})[$nativeLang] = chatPrompt // replace translation by user's (wrong) message
                responseMsg = {role: 'assistant', content: response};
            } else {
                let response = DocumentC.partialDocument(ANON_RESPONSE, $nativeLang, undefined, undefined)
                responseMsg = {role: 'assistant', content: response};
            }
            new_history.push(newMessage) // we only push user prompt now cause we don't want it here if connection error
            new_history.push(responseMsg)
            chatPrompt = ''
        } catch (err: any) {
            if (err.message === "Chat history too long.") {
                new_history.push({role: 'internal', content: DocumentC.partialDocument(MAX_LENGTH_RESPONSE, $nativeLang, undefined, undefined)})                
            } else {
                console.error(err)
                new_history.push({role: 'internal', content: DocumentC.partialDocument(OTHER_ERROR_RESPONSE, $nativeLang, undefined, undefined)})
            }
        } finally {
            loading = false
        }
        $chatHistory = new_history
        await tick();
        iChat?.focus()
        scrollToLatestChatMessage()
    }

    function messageHistoryForChatGpt(history: {role: string, content: DocumentC}[]) {
        return history.filter(el => el.role!='internal').map(el => ({role: (el.role == 'correction' ? 'user' : el.role), content: el.content.text.text}))
    }

    function scrollToLatestChatMessage() {
        const elementsToScroll = (inline ? [readerComponent.getDivTask(), readerComponent.getSolutionField()] : [messageHistoryContainer])
        elementsToScroll.forEach(el => el?.scroll({top: el.scrollHeight, behavior: 'smooth'}))
        // FIXME: solutionField automatically gets scrolled when divTask does, which means it will snap back afterwards. For now it's fine
    }

    function isEdited(correction: DocumentC) {
        return correction.text.text.replaceAll(/\W+/g, '') !== chatPrompt.replaceAll(/\W+/g, '') // remove everything that is not a word, then compare
    }

</script>

<style>
    .promptSuggestions {
        display: flex;
        justify-content: center;
    }
    .promptSuggestions:has(.promptSuggestion + .promptSuggestion) {
        justify-content: space-evenly;
    }
    .promptSuggestions:has(.promptSuggestion + .promptSuggestion + .promptSuggestion ) {
        justify-content: space-between;
    }
    .promptSuggestion {
        font-size: xx-small;
        width: 31%;
        line-height: 10px;
        height: auto;
        opacity: 0.5;
        border-color: blue;
        margin-bottom: 8px;
        box-shadow: #80808018 0 2px 5px 2px; /* Downwards shadow and on left and right side*/
    }

    .chatMessage {
        white-space: pre-wrap;
        /* max-height: 18dvh; 
        overflow-y: scroll; */
    }

    .chatHistoryHidden {
        visibility: hidden;
        position: relative; /* necessary for z-index to take effect */
        z-index: -5;
    }

    .card {
        width: fit-content;
        max-width: calc(80% - var(--padding-card));
        margin-top: var(--padding-card);
        margin-bottom: var(--padding-card);
    }

    #chatInputContainer {
        position: relative;
    }
    
    #submitChat, #closeChat {
        position: absolute;
        bottom: 1px;
        height: calc(100% - 2px);
        border-radius: 20px;
        width: var(--button-height);
    }
        
    #submitChat {
        right: 1px;
    }
        
    #closeChat {
        left: 1px;
    }
    
    #chatComponent {
        position: relative;
        width: 100%;
        padding-bottom: 10px;
    }

    /* Inline vs floating stuff */

    #messageHistoryContainer.floatAboveParent {
        max-height: 80dvh;
        overflow-y: auto;
    }

    .floatAboveParent {
        position: absolute;
        bottom: 100%;
    }

    .inline .card { /* TODO: only for inline (probably use in html instead )*/
        background-color: var(--body-background-color);
        box-shadow: var(--box-shadow-light);
    }

    .card.user, .card.correction {
        margin-inline-start: auto;
        margin-inline-end: 0;
    }

    .card.internal {
        margin-inline-start: auto;
        margin-inline-end: auto;
    }
</style>

<div id="chatComponent" on:focus|capture={()=>{chatFocussed = true}} on:focusout|capture={()=>{chatFocussed = false}}>
    <div id="messageHistoryContainer" bind:this={messageHistoryContainer} class:chatHistoryHidden={!chatFocussed && !loading && !inline} class:floatAboveParent={!inline} class:inline={inline}>
        {#each $chatHistory as msg, i}
                {#if msg.role === 'assistant' || msg.role === 'user' || msg.role === 'correction'}
                    <div class={"card "+msg.role}>
                        <em><strong>
                            <BadgeComponent 
                                text={msg.role === 'user' ? 'You' : msg.role === 'assistant' ? ($currentTask?.character ?? 'AI') : (translationLang === 'original' ? 'You+AI' : 'You')} 
                                tooltip={msg.role === 'user' ? "Your response" : msg.role === 'assistant' ? "AI character" : (translationLang === 'original' ? 'Your response, corrected by AI. Feel free to ask, why AI wrote it like this.' : 'Your original response.')}/>
                        </strong></em>&nbsp;
                        {#if translationLang === 'original'}
                            {#if msg.content.text?.tokens}
                                <TaskComponent task={msg.content} srWords={srWords} trySpeak={trySpeak}/>
                            {:else}
                                <p class="chatMessage">{msg.content.text.text.trim()}</p>
                            {/if}
                        {:else if msg.content.text?.translations?.[translationLang]}
                            <p class="chatMessage">{msg.content.text.translations[translationLang].trim()}</p>
                        {/if}
                    </div>
                {:else if msg.role === 'internal' && i == $chatHistory.length-1}
                    <div class="card internal">
                        <em><strong><BadgeComponent text='Error' tooltip="Error"/></strong></em>&nbsp;
                        <p class="chatMessage">{msg.content?.text?.text.trim()}</p>
                    </div>
                {/if}
        {/each}
        {#if loading}
            <div class="card" class:loading/>
        {/if}
    </div>
    {#if chatBoxTitle != undefined && (!$chatOutcome || !isGame)}
        {#if !inline}   
            <div class="promptSuggestions">
                <button class="promptSuggestion" on:click={onClickChatSuggestion} disabled={loading}>
                    How is the past tense formed?
                </button>
                {#if lastFailed}
                    {#if lastFailedLemma && lastFailedLemma !== lastFailed}
                        <button class="promptSuggestion" on:click={onClickChatSuggestion} disabled={loading}>
                            Why is it {lastFailed} and not {lastFailedLemma} here?
                        </button>
                    {/if}
                    <button class="promptSuggestion" on:click={onClickChatSuggestion} disabled={loading}>
                        Why is {lastFailed} used here?
                    </button>
                {/if}
            </div>
        {:else if isGame && $currentTask?.suggested_replies?.length && showGameChatSuggestions}
            <div class="promptSuggestions">
                {#each $currentTask?.suggested_replies as suggestion}
                    <button class="promptSuggestion" on:click={onClickChatSuggestion} disabled={loading}>
                        {suggestion}
                    </button>                    
                {/each}
            </div>
        {/if}
        <div id="chatInputContainer">
            <div contenteditable id="iChat" data-placeholder={chatBoxTitle} bind:innerText={chatPrompt} bind:this={iChat}/>
            {#if chatFocussed && $chatHistory.length }
                <button id="closeChat" on:click={() => {document?.activeElement?.blur()}}>x</button>       
            {/if}    
            <button id="submitChat" on:click={onSubmitChatField} disabled={loading}><b><em>
                {#if chatPrompt}
                ➥
                {:else}
                AI            
                {/if}
            </em></b></button>
        </div>
    {/if}
</div>