<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<script lang="ts" defer>
	import { nativeLang, targetLang } from "$lib/stores";

    export let word: string;
    export let isFailed: boolean;
    export let isSrWord: boolean = false;
    export let isClickable: boolean;

    function onDictClick(event: Event) {
        event.preventDefault();

        // DO NOT MERGE THIS INTO MASTER BRANCH
    
        const isAndroid = /Android/i.test(navigator.userAgent); // chech whether user agent matches /Android/ regex

        if (isAndroid) {
            window.open((event.currentTarget as HTMLAnchorElement).href);
        } else {
            // If not on Android, directly go to Google Translate
            window.open(`https://translate.google.com/?sl=${$targetLang}&tl=${$nativeLang}&text=${word}`);
        }
    }
</script>

{#if isClickable}
<span style:display="inline-block" class={'pointer span-'+word + (isFailed ? ' clicked' : isSrWord ? ' srWord' : '')} on:click>
    {#if isFailed}
    <a href={'langki://word/?w='+word} on:click={onDictClick}>📕</a>
    {/if}
    {word}
</span>
{:else}
{word}
{/if}
