<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<script lang="ts" defer>
	import { dictionaryWord, failedWords, isGrammarHighlightingOn, morphHighlightFilter } from "$lib/stores";
    const NON_CLICKABLE_POS_IDS = new Set([-1, 97, 99, 101]) // added -1 for whitespace

    export let token: {word: string, pos: number, lemma_: string, morph?: string};
    $: isFailed = $failedWords?.has(token?.word);
    export let isSrWord: boolean = false;
    $: isClickable = !NON_CLICKABLE_POS_IDS.has(token?.pos);

    function onDictClick(event: Event) {
        $dictionaryWord = token?.word
    }
</script>

{#if isClickable}
<span 
    style:display="inline-block" 
    class={
        'pointer span-'
        +token?.word 
        + (isFailed ? ' clicked' : 
            isSrWord ? ' srWord' : 
            $isGrammarHighlightingOn && $morphHighlightFilter?.length && $morphHighlightFilter.split('&&').every(filter => token?.morph?.includes(filter.trim())) ? ' grammar-marked' : 
            '')} 
    on:click>
    {#if isFailed}
    <a href={'langki://word/?w='+token?.word} on:click|stopPropagation|preventDefault={onDictClick}>📕</a>
    {/if}
    {token?.word}
</span>
{:else}
{token?.word}
{/if}
