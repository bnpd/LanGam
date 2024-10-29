<script lang="ts" defer>
	import Popup from "./Popup.svelte";

    export let content: {title_en: string, text_en: string}
    $: if (content && contentDiv) contentDiv.innerHTML = content.text_en
    let isOpen = false
    let contentDiv: HTMLDivElement
</script>

<style>
    .grammar-container {
        overflow-x: scroll;
        text-align: justify;
        line-height: 1.6em;
    }
</style>

<Popup closeButtonText="Done" bind:isOpen={isOpen}>
    <div class="grammar-container">
        <h1>{content.title_en}</h1>
        <div bind:this={contentDiv}></div>
    </div>
</Popup>
{#if !isOpen}
    <button id="btnPowers" on:click={() => isOpen = true}>
        📖
    </button>
{/if}
