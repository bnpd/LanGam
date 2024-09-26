<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<script lang="ts" defer>
	import { nativeLang, targetLang } from "$lib/stores";

    export let word: string;
    export let isFailed: boolean;
    export let isSrWord: boolean = false;
    export let isClickable: boolean;
</script>

{#if isClickable}
<span style:display="inline-block" class={'pointer span-'+word + (isFailed ? ' clicked' : isSrWord ? ' srWord' : '')} on:click>
    {#if isFailed}
    <a href="https://translate.google.com/?sl={$targetLang}&tl={$nativeLang}&text={word}">📕</a>
    {/if}
    {word}
</span>
{:else}
{word}
{/if}
