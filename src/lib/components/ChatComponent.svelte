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
    $: if ($currentTask) response = $currentTask?.question?.text; // reset response on changes to currentTask
    $: if (typeof document !== 'undefined') {            
            let mainContent = document?.getElementById('contentbox')
            if (mainContent) {
                mainContent.style.opacity = (response && chatFocussed) ? "0.65" : "1"
            }
        }
    
    export let readerComponent: ReaderComponent;
    export let chatFocussed: boolean = false;
    let response: string | undefined;
    let chatPrompt: string | undefined
    let iChat: HTMLDivElement
    let loading: boolean = false

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
        response = ''
        loading = true
        try {
            response = $user ? await sendChat((e.currentTarget as HTMLButtonElement).innerText, undefined, undefined, readerComponent.getVisibleParagraphs())
                         : ANON_RESPONSE
        } catch (e) {
            response = 'Cannot connect, please try again'
        } finally {
            loading = false
        }
    }

    async function onSubmitChatPrompt(e: Event) {
        if (chatPrompt) {
            response = ''
            loading = true
            try {
                response = $user ? await sendChat(chatPrompt, $targetLang, $currentTask.docId, undefined)
                                 : ANON_RESPONSE
            } catch (e) {
                response = 'Cannot connect, please try again'
            } finally {
                loading = false
            }
        } else {
            iChat?.focus()
        }
    }
</script>

<div id="chatComponent" on:focus|capture={()=>{chatFocussed = true}} on:focusout|capture={()=>{chatFocussed = false}}>
    {#if response && chatFocussed || loading}
        <div class="card" class:loading style="max-height: 18vh; overflow-y: scroll;" id="responseBox">
            <em><strong><BadgeComponent text='AI' tooltip="AI's response"/></strong></em>&nbsp;{response}
        </div>
    {/if}
    <div>
        <button class="promptSuggestion" on:click={onClickChatSuggestion}>
            How is the past tense formed?
        </button>
        {#if lastFailed}
            {#if lastFailedLemma !== lastFailed}
                <button class="promptSuggestion" on:click={onClickChatSuggestion}>
                    Why is it {lastFailed} and not {lastFailedLemma} here?
                </button>
            {/if}
            <button class="promptSuggestion" on:click={onClickChatSuggestion}>
                Why is {lastFailed} used here?
            </button>
        {/if}
    </div>
    <div contenteditable id="iChat" data-placeholder="Ask me ✨" bind:textContent={chatPrompt} bind:this={iChat}/>
    <button id="submit" on:click={onSubmitChatPrompt}><b><em>
        {#if chatPrompt}
        ➥
        {:else}
        AI            
        {/if}
    </em></b></button>
</div>