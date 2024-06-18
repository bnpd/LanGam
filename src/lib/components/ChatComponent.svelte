<script lang="ts">
	import { currentTask, failedWords } from "$lib/stores";
    
    /**
     * @type {string | undefined}
     */
    $: lastFailed = Array.from($failedWords).at(-1);
    $: lastFailedLemma = lastFailed ? findLemma(lastFailed) : undefined

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

<div id="chatComponent">
    <div>
        <button class="promptSuggestion">Explain the most important grammar for this text.</button>
        {#if lastFailed}
            {#if lastFailedLemma !== lastFailed}
                <button class="promptSuggestion">Why is it {lastFailed} and not {lastFailedLemma} here?</button>
            {/if}
            <button class="promptSuggestion">Why is {lastFailed} used here?</button>
        {/if}
    </div>
    <div contenteditable id="iChat" data-placeholder="Ask me ✨"/>
    <button id="submit"><b><em>AI</em></b></button>
</div>