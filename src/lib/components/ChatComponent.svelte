<script lang="ts">
	import { currentTask, failedWords, targetLang, user } from "$lib/stores";
	import BadgeComponent from "./BadgeComponent.svelte";
	import ReaderComponent from "./ReaderComponent.svelte";
	import { sendChat } from "./backend";

    const ANON_RESPONSE = 'AI cannot help with the Drnuk language yet - but sign up to get help with Polish.'
    
    /**
     * @type {string | undefined}
     */
    $: lastFailed = Array.from($failedWords).at(-1);
    $: lastFailedLemma = lastFailed ? findLemma(lastFailed) : undefined
    $: if ($currentTask && $currentTask?.question?.text?.length) chatHistory = [{type: 'ai', text: $currentTask.question.text}]; // reset question on changes to currentTask
    $: if (typeof document !== 'undefined') {            
            let mainContent = document?.getElementById('contentbox')
            if (mainContent) {
                mainContent.style.opacity = (chatHistory.length && chatFocussed) ? "0.65" : "1"
            }
        }
    
    export let readerComponent: ReaderComponent;
    export let chatFocussed: boolean = false;
    let chatPrompt: string | undefined
    let iChat: HTMLDivElement
    let loading: boolean = false
    let chatHistory: {type: string, text: string}[] = [];

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
        try {
            let response = {type: 'ai', text: ($user ? await sendChat(chatPrompt, undefined, undefined, readerComponent.getVisibleParagraphs())
                         : ANON_RESPONSE)};
            chatHistory.push({type: 'user', text: chatPrompt})
            chatHistory.push(response)
            chatPrompt = ''
        } catch (e) {
            chatHistory.push({type: 'system', text: 'Cannot connect, please try again'})
        } finally {
            loading = false
        }
    }

    async function onSubmitChatPrompt(e: Event) {
        if (chatPrompt) {
            loading = true
            try {
                let response = {type: 'ai', text: ($user ? await sendChat(chatPrompt, $targetLang, $currentTask.docId, undefined)
                                 : ANON_RESPONSE)};
                chatHistory.push({type: 'user', text: chatPrompt})
                chatHistory.push(response)
                chatPrompt = ''
            } catch (e) {
                chatHistory.push({type: 'system', text: 'Cannot connect, please try again'})
            } finally {
                loading = false
            }
        } else {
            iChat?.focus()
        }
    }
</script>

<style>
    #iChat {
      width: 100%;
      min-height: var(--button-height);
      border-radius: 20px;
      background-color: aliceblue;
      max-height: calc(1.5*var(--button-height));
      box-sizing: border-box;
      padding: 12px calc(var(--button-height) + 2px);
      overflow: auto;
    }
    
    #iChat::-webkit-scrollbar {
      display: none;
    }
    
    #iChat:empty::before {
      content: attr(data-placeholder);
      color: #999;
      pointer-events: none;
    }
    
    #iChat:focus {
      outline-color: blue;
    }
    
    #submitChat {
      position: absolute;
      right: 1px;
      bottom: 1px;
      border-radius: 20px;
      width: var(--button-height);
      height: var(--button-height);
    }
    
    #closeChat {
      position: absolute;
      left: 1px;
      bottom: 1px;
      border-radius: 20px;
      width: var(--button-height);
      height: var(--button-height);      
    }
    
    #chatComponent {
      width: 100%;
      position: absolute;
      bottom: 0;
      margin-bottom: calc(var(--button-height) + 5px);
      left: 0;
    }
</style>

<div id="chatComponent" on:focus|capture={()=>{chatFocussed = true}} on:focusout|capture={()=>{chatFocussed = false}}>
    {#if chatHistory.length && chatFocussed || loading}
        {#each chatHistory as msg, i}
                {#if msg.type === 'ai'}
                    <div class="card" class:loading style="max-height: 18vh; overflow-y: scroll;" id="responseBox">
                        <em><strong><BadgeComponent text='AI' tooltip="AI's response"/></strong></em>&nbsp;
                        {msg.text}
                    </div>
                {:else if msg.type === 'user'}
                    <div class="card" class:loading style="max-height: 18vh; overflow-y: scroll;" id="responseBox">
                        <em><strong><BadgeComponent text='You' tooltip="Your response"/></strong></em>&nbsp;
                        {msg.text}
                    </div>
                {:else if msg.type === 'system' && i == chatHistory.length-1}
                    <div class="card" class:loading style="max-height: 18vh; overflow-y: scroll;" id="responseBox">
                        <em><strong><BadgeComponent text='Error' tooltip="Error"/></strong></em>&nbsp;
                        {msg.text}
                    </div>
                {/if}
        {/each}
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
    <div contenteditable id="iChat" data-placeholder="Ask me ✨" bind:textContent={chatPrompt} bind:this={iChat}/>
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