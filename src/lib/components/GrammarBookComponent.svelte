<script lang="ts" defer>
	import Popup from "./Popup.svelte";

    export let content: {title_en: string, text_en: string}
    $: if (content && contentDiv) contentDiv.innerHTML = content.text_en
    let isOpen = false
    let contentDiv: HTMLDivElement

    function toggleIsOpen() {
        isOpen = !isOpen
    }
</script>

<style>
    .grammar-container {
        overflow-x: scroll;
        text-align: justify;
        line-height: 1.6em;
    }
</style>

{#if isOpen}
    <Popup on:closed={toggleIsOpen} closeButtonText="Done">
        <div class="grammar-container">
            <h1>{content.title_en}</h1>
            <div bind:this={contentDiv}></div>
        </div>
    </Popup>
{:else}
    <button id="btnPowers" on:click={toggleIsOpen}>
        📖
    </button>
{/if}
