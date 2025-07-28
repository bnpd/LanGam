<script lang="ts" defer>
	import { grammarBookOpened } from "$lib/stores";
	import Popup from "./Popup.svelte";
    let umami: any; // Umami is initialized in the +layout.svelte from script tag

    export let content: {title_en: string, text_en: string}
    $: if (content && contentDiv) contentDiv.innerHTML = content.text_en
    let isOpen = false
    let contentDiv: HTMLDivElement
</script>

<style>
    .grammar-container {
        overflow-y: auto;
        text-align: justify;
        line-height: 1.6em;
    }

    .card {
        width: fit-content;
        max-width: calc(80% - var(--padding-card));
        margin-top: var(--padding-card);
        margin-bottom: var(--padding-card);
        background-color: var(--body-background-color);
        box-shadow: var(--box-shadow-light);
    }
</style>

<Popup closeButtonText="Done" bind:isOpen={isOpen} on:closed={()=> {$grammarBookOpened = true; umami?.track('Grammar Book closed')}}>
    <div class="grammar-container">
        <h1>{content.title_en}</h1>
        {#if !$grammarBookOpened}
            <div class="card">
                ⓘ Here you can find an optional grammar lesson related to each chapter. The corresponding words will be highlighted in the text so that you can spot the pattern how the grammar is formed.
            </div>
        {/if}
        <div bind:this={contentDiv} style:width="99%"></div>
    </div>
</Popup>
{#if !isOpen}
    <button on:click={() => isOpen = true} class={"gameNavBtn " + (!$grammarBookOpened ? "flash delayed" : "")} data-umami-event="Grammar Book opened">
        📖
    </button>
{/if}
