<script lang="ts">
	import { currentTask, failedWords, user } from "$lib/stores";
	import ReaderComponent from "./ReaderComponent.svelte";
	import { sendChat } from "./backend";
    
    /**
     * @type {string | undefined}
     */
    $: lastFailed = Array.from($failedWords).at(-1);
    $: lastFailedLemma = lastFailed ? findLemma(lastFailed) : undefined
    $: if ($currentTask) response = undefined; // reset response on changes to currentTask
    
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

{#if response}
    <div class="boxBig">{response}</div>
{/if}
<div id="chatComponent">
    <div>
        <button class="promptSuggestion" on:click={async () => {response = await sendChat($user, "Explain the most important grammar for this text.", $currentTask.docId, undefined)}}>
            Explain the most important grammar for this text.
        </button>
        {#if lastFailed}
            {#if lastFailedLemma !== lastFailed}
                <button class="promptSuggestion" on:click={async () => {response = await sendChat($user, `Why is it ${lastFailed} and not ${lastFailedLemma} here?`, undefined, readerComponent.getVisibleParagraphs())}}>
                    Why is it {lastFailed} and not {lastFailedLemma} here?
                </button>
            {/if}
            <button class="promptSuggestion" on:click={async () => {response = await sendChat($user, `Why is ${lastFailed} used here?`, undefined, readerComponent.getVisibleParagraphs())}}>
                Why is {lastFailed} used here?
            </button>
        {/if}
    </div>
    <div contenteditable id="iChat" data-placeholder="Ask me ✨" bind:textContent={chatPrompt} bind:this={iChat}/>
    <button id="submit" on:click={async () => {if (chatPrompt) {response = await sendChat($user, chatPrompt, $currentTask.docId, undefined)} else {iChat?.focus()}}}><b><em>
        {#if chatPrompt}
        ➥
        {:else}
        AI            
        {/if}
    </em></b></button>
</div>