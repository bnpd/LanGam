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
    
        const translatorUrl = `https://translate.google.com/?sl=${$targetLang}&tl=${$nativeLang}&text=${word}`

        const isAndroid = /Android/i.test(navigator.userAgent); // chech whether user agent matches /Android/ regex

        const start = Date.now();
        if (isAndroid) {
            window.open((event.currentTarget as HTMLAnchorElement).href);
            
            setTimeout(() => {
                if (Date.now() - start < 500) {
                    // If the elapsed time is less than 500ms, assume the app did not open
                    window.open(translatorUrl);
                }

            }, 250);
        } else {
            // If not on Android, directly go to Google Translate
            window.open(translatorUrl);
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
