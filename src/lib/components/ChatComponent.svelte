<script lang="ts">
	import { currentTask, failedWords, targetLang, user } from "$lib/stores";
	import { afterUpdate } from "svelte";
	import BadgeComponent from "./BadgeComponent.svelte";
	import ReaderComponent from "./ReaderComponent.svelte";
	import { sendChat } from "./backend";

    const ANON_RESPONSE = 'AI cannot help with the Drnuk language yet - but sign up to get help with Polish.'
    
    /**
     * @type {string | undefined}
     */
    $: lastFailed = Array.from($failedWords).at(-1);
    $: lastFailedLemma = lastFailed ? findLemma(lastFailed) : undefined
    $: if ($currentTask && $currentTask?.question?.text?.length) chatHistory = [{role: 'assistant', content: $currentTask.question.text}]; // reset question on changes to currentTask
    $: if (typeof document !== 'undefined') {            
            let mainContent = document?.getElementById('contentbox')
            if (mainContent) {
                mainContent.style.opacity = (chatHistory.length && chatFocussed) ? "0.2" : "1"
            }
        }
    
    export let readerComponent: ReaderComponent;
    export let chatFocussed: boolean = false;
    let chatPrompt: string | undefined
    let iChat: HTMLDivElement
    let loading: boolean = false
    let chatHistory: {role: string, content: string}[] = [];
    let shouldFocusChat: boolean;

    /**
     * Finds the first occurrence of word in the text and returns the corresponding lemma (thus not necessarily the lemma for that ocurrence that the user clicked)
     * @param word The word of which the lemma is wanted
     */
    function findLemma(word: string) {
        if (!word) return undefined
        for (const token of Object.values($currentTask.text.tokens)) {
            if ((token as any).word == word) {
                return (token as any).lemma_
            }
        }
    }

    async function onClickChatSuggestion(e: Event) {
        loading = true
        chatPrompt = (e.currentTarget as HTMLButtonElement).innerText
        const newMessage = {role: 'user', content: chatPrompt}
        try {
            const response = {role: 'assistant', content: ($user ? await sendChat(chatHistory.filter(el => el.role!='internal').concat([newMessage]), undefined, undefined, readerComponent.getVisibleParagraphs())
                         : ANON_RESPONSE)};
            chatHistory.push(newMessage) // we only push user prompt now cause we don't want it here if connection error
            chatHistory.push(response)
            chatPrompt = ''
        } catch (e: any) {
            if (e.message === "Chat history too long.") {
                chatHistory.push({role: 'internal', content: "This chat has reached it's maximum length. Try chatting about another text."})                
            } else {
                chatHistory.push({role: 'internal', content: 'Cannot connect, please try again'})
            }
        } finally {
            loading = false
        }
        shouldFocusChat = true;
    }

    async function onSubmitChatPrompt(e: Event) {
        if (chatPrompt) {
            loading = true
            const newMessage = {role: 'user', content: chatPrompt}
            try {
                let response = {role: 'assistant', content: ($user ? await sendChat(chatHistory.filter(el => el.role!='internal').concat([newMessage]), $targetLang, $currentTask.docId, undefined)
                                 : ANON_RESPONSE)};
                chatHistory.push(newMessage) // we only push user prompt now cause we don't want it here if connection error
                chatHistory.push(response)
                chatPrompt = ''
            } catch (e) {
                if (e.message === "Chat history too long.") {
                    chatHistory.push({role: 'internal', content: "This chat has reached it's maximum length. Try chatting about another text."})                
                } else {
                    chatHistory.push({role: 'internal', content: 'Cannot connect, please try again'})
                }
            } finally {
                loading = false
            }
            shouldFocusChat = true
        } else {
            iChat?.focus()
        }
    }

    afterUpdate(() => {
        if (shouldFocusChat) {
            iChat?.focus()
            shouldFocusChat = false;
        }
    });
</script>

<style>
    .promptSuggestion {
      font-size: xx-small;
      width: fit-content;
      max-width: 30vw;
      line-height: 10px;
      height: auto;
      opacity: 0.5;
      border-color: blue;
      margin: 0 1vw;
      margin-bottom: 8px;
      box-shadow: #80808018 0 2px 5px 2px; /* Downwards shadow and on left and right side*/
    }
    
    #submitChat, #closeChat {
      position: absolute;
      bottom: 1px;
      border-radius: 20px;
      width: var(--button-height);
      height: var(--button-height);
    }
        
    #submitChat {
      right: 1px;
    }
        
    #closeChat {
      left: 1px;
    }
    
    #chatComponent {
      width: 100%;
      position: absolute;
      bottom: 0;
      margin-bottom: calc(var(--button-height) + 5px);
      left: 0;
    }
</style>

<div id="chatComponent" on:focus|capture={()=>{chatFocussed = true; console.log('chatFocus');}} on:focusout|capture={()=>{chatFocussed = false; console.log(document?.activeElement);}}>
    {#if chatFocussed || loading}
        {#each chatHistory as msg, i}
                {#if msg.role === 'assistant'}
                    <div class="card" style="max-height: 18vh; overflow-y: scroll;" id="responseBox">
                        <em><strong><BadgeComponent text='AI' tooltip="AI's response"/></strong></em>&nbsp;
                        {msg.content}
                    </div>
                {:else if msg.role === 'user'}
                    <div class="card" style="max-height: 18vh; overflow-y: scroll;" id="responseBox">
                        <em><strong><BadgeComponent text='You' tooltip="Your response"/></strong></em>&nbsp;
                        {msg.content}
                    </div>
                {:else if msg.role === 'internal' && i == chatHistory.length-1}
                    <div class="card" style="max-height: 18vh; overflow-y: scroll;" id="responseBox">
                        <em><strong><BadgeComponent text='Error' tooltip="Error"/></strong></em>&nbsp;
                        {msg.content}
                    </div>
                {/if}
        {/each}
    {/if}
    {#if loading}
        <div class="card" class:loading/>
    {/if}
    <div>
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
    <div contenteditable id="iChat" data-placeholder="Ask me ✨" bind:innerText={chatPrompt} bind:this={iChat}/>
    {#if chatFocussed && chatHistory.length}
        <button id="closeChat" on:click={() => {document?.activeElement?.blur()}}>x</button>       
    {/if}    
    <button id="submitChat" on:click={onSubmitChatPrompt} disabled={loading}><b><em>
        {#if chatPrompt}
        ➥
        {:else}
        AI            
        {/if}
    </em></b></button>
</div>