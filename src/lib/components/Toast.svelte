<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<script lang="ts" defer>
	import { fly } from "svelte/transition";

    export let message: string | undefined = undefined;
    export let textReject: string | undefined = undefined;
    export let onReject: { (): void; } | undefined = undefined;
    export let onTimeout: { (): void; } | undefined = undefined;

    $: if (message) setTimeout(() => { message = undefined; if (onTimeout) {onTimeout()} }, 4000);

    function hide() {
        message=undefined
    }
</script>

<style>
    #toast {
        z-index: 201;
    }
</style>

{#if message}
<div id="toast" on:touchmove={hide} on:click={hide} transition:fly={{ y: 100, duration: 500 }}>
    <p>{message}</p> 
    {#if onReject && textReject}
        <button on:click={onReject}>{textReject}</button>
    {/if}
</div>    
{/if}