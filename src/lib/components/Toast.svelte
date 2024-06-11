<script lang="ts">
	import { fly } from "svelte/transition";

    export let message: string | undefined = undefined;
    export let textReject: string | undefined = undefined;
    export let onReject: { (): void; } | undefined = undefined;

    $: if (message) setTimeout(() => { message = undefined; }, 4000);

    function hide() {
        message=undefined
        onReject=undefined
        textReject=undefined
    }
</script>

{#if message}
<div id="toast" on:touchmove={hide} on:click={hide} transition:fly={{ y: 100, duration: 500 }}>
    <p>{message}</p> 
    {#if onReject && textReject}
        <button on:click={onReject}>{textReject}</button>
    {/if}
</div>    
{/if}