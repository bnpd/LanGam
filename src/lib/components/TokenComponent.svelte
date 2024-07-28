<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<script lang="ts">
	import { nativeLang, targetLang } from "$lib/stores";

    export let word: string;
    export let isFailed: boolean;
    export let isSrWord: boolean = false;
    export let isClickable: boolean;

    function onDictClick(event: Event) {
        event.preventDefault();
        const start = Date.now();
        window.open((event.currentTarget as HTMLAnchorElement).href);
        
        setTimeout(() => {
            if (Date.now() - start < 500) {
                // If the elapsed time is less than 500ms, assume the app did not open
                window.open(`https://translate.google.com/?sl=${$targetLang}&tl=${$nativeLang}&text=${word}`);
            }

        }, 250);
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
