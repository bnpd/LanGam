<script lang="ts">
	import { currentTask, failedWords, inlineChatHistoryTranslation, targetLang, user } from "$lib/stores";
	import { tick } from "svelte";
	import BadgeComponent from "./BadgeComponent.svelte";
	import type ReaderComponent from "./ReaderComponent.svelte";
	import { getUserData, sendChat } from "./backend";
	import { writable, type Writable } from "svelte/store";

    const ANON_RESPONSE = 'AI cannot help with the Drnuk language yet - but sign up to get help with Polish.'
    
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
    export let chatFocussed: boolean = false;
    export let inline: boolean;
    export let chatBoxTitle: string | undefined = undefined;
    export let chatHistory: Writable<{role: string, content: string}[]> = new writable([]);
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

    async function submitChat(partialContext: boolean) {
        loading = true
        const newMessage = {role: 'user', content: chatPrompt}
        let new_history = $chatHistory
        try {
            let responseStr
            let response
            if ($user) {
                response = partialContext 
                                 ? await sendChat(new_history.filter(el => el.role!='internal').concat([newMessage]), undefined, undefined, readerComponent.getVisibleParagraphs())
                                 : await sendChat(new_history.filter(el => el.role!='internal').concat([newMessage]), $targetLang, $currentTask.docId, undefined);
                console.log(response);                
                responseStr = response.text.text
            } else {
                responseStr = ANON_RESPONSE
            }
            const responseMsg = {role: 'assistant', content: responseStr};
            new_history.push(newMessage) // we only push user prompt now cause we don't want it here if connection error
            new_history.push(responseMsg)
            chatPrompt = ''

            if (inline) {
                let new_translations = $inlineChatHistoryTranslation
                new_translations.push(newMessage) // temporarily pushing what user typed also to translationHistory
                new_translations.push({role: 'assistant', content: response?.text?.translations?.en})
                $inlineChatHistoryTranslation = new_translations
            }

        } catch (err: any) {
            if (err.message === "Chat history too long.") {
                new_history.push({role: 'internal', content: "This chat has reached it's maximum length. Try chatting about another text."})                
            } else {
                new_history.push({role: 'internal', content: 'Cannot connect, please try again'})
            }
        } finally {
            loading = false
        }
        $chatHistory = new_history
        await tick();
        iChat?.focus()
        scrollToLatestChatMessage()
    }

    function scrollToLatestChatMessage() {
        const elementsToScroll = (inline ? [readerComponent.getDivTask(), readerComponent.getSolutionField()] : [messageHistoryContainer])
        elementsToScroll.forEach(el => el.scroll({top: el.scrollHeight, behavior: 'smooth'}))
        // FIXME: solutionField automatically gets scrolled when divTask does, which means it will snap back afterwards. For now it's fine
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
    }

    .card.user {
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
                {#if msg.role === 'assistant'}
                    <div class="card assistant" id="responseBox">
                        <em><strong><BadgeComponent text='AI' tooltip="AI's response"/></strong></em>&nbsp;
                        <span class="chatMessage">{msg.content}</span>
                    </div>
                {:else if msg.role === 'user'}
                    <div class="card user" id="responseBox">
                        <em><strong><BadgeComponent text='You' tooltip="Your response"/></strong></em>&nbsp;
                        <span class="chatMessage">{msg.content}</span>
                    </div>
                {:else if msg.role === 'internal' && i == $chatHistory.length-1}
                    <div class="card internal" id="responseBox">
                        <em><strong><BadgeComponent text='Error' tooltip="Error"/></strong></em>&nbsp;
                        <span class="chatMessage">{msg.content}</span>
                    </div>
                {/if}
        {/each}
        {#if loading}
            <div class="card" class:loading/>
        {/if}
    </div>
    {#if chatBoxTitle != undefined}
        {#if !inline}   
            <div class="promptSuggestions">
                <button class="promptSuggestion" on:click={onClickChatSuggestion} disabled={loading}>
                    How is the past tense formed?
                </button>
                {#if lastFailed}
                    {#if lastFailedLemma !== lastFailed}
                        <button class="promptSuggestion" on:click={onClickChatSuggestion} disabled={loading}>
                            Why is it {lastFailed} and not {lastFailedLemma} here?
                        </button>
                    {/if}
                    <button class="promptSuggestion" on:click={onClickChatSuggestion} disabled={loading}>
                        Why is {lastFailed} used here?
                    </button>
                {/if}
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