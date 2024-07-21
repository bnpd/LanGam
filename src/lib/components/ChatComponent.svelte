<script lang="ts">
	import { currentTask, failedWords, targetLang, user } from "$lib/stores";
	import ReaderComponent from "./ReaderComponent.svelte";
	import { sendChat } from "./backend";
    
    /**
     * @type {string | undefined}
     */
    $: lastFailed = Array.from($failedWords).at(-1);
    $: lastFailedLemma = lastFailed ? findLemma(lastFailed) : undefined
    $: if ($currentTask) response = undefined; // reset response on changes to currentTask
    let chatFocussed: boolean;
    $: if (typeof document !== 'undefined') {            
            let mainContent = document?.getElementById('contentbox')
            if (mainContent) {
                mainContent.style.opacity = (response && chatFocussed) ? "0.65" : "1"
            }
        }
    
    export let readerComponent: ReaderComponent;

    let chatPrompt: string | undefined
    let response: string | undefined
    let iChat: HTMLDivElement

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
</script>

<div id="chatComponent" on:focus|capture={()=>{chatFocussed = true}} on:focusout|capture={()=>{chatFocussed = false}}>
    {#if response && chatFocussed}
        <div class="boxBig" style="max-height: 18vh; overflow-y: scroll;" id="responseBox">{response}</div>
    {/if}
    <div>
        <button class="promptSuggestion" on:click={async (e) => {response = await sendChat(e.currentTarget.innerText, undefined, undefined, readerComponent.getVisibleParagraphs())}}>
            How is the past tense formed?
        </button>
        {#if lastFailed}
            {#if lastFailedLemma !== lastFailed}
                <button class="promptSuggestion" on:click={async (e) => {response = await sendChat(e.currentTarget.innerText, undefined, undefined, readerComponent.getVisibleParagraphs())}}>
                    Why is it {lastFailed} and not {lastFailedLemma} here?
                </button>
            {/if}
            <button class="promptSuggestion" on:click={async (e) => {response = await sendChat(e.currentTarget.innerText, undefined, undefined, readerComponent.getVisibleParagraphs())}}>
                Why is {lastFailed} used here?
            </button>
        {/if}
    </div>
    <div contenteditable id="iChat" data-placeholder="Ask me ✨" bind:textContent={chatPrompt} bind:this={iChat}/>
    <button id="submit" on:click={async () => {if (chatPrompt) {response = await sendChat(chatPrompt, $targetLang, $currentTask.docId, undefined)} else {iChat?.focus()}}}><b><em>
        {#if chatPrompt}
        ➥
        {:else}
        AI            
        {/if}
    </em></b></button>
</div>