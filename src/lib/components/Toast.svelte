<script lang="ts">
    export let message: string | undefined = undefined;
    export let textReject: string | undefined = undefined;
    export let onReject: { (): void; } | undefined = undefined;

    $: if (message) setTimeout(() => { message = undefined; }, 3000);

    function hide() {
        message=undefined
    }
</script>

<div id="toast" hidden={!message} on:touchmove={hide} on:click={hide}>
    <p>{message}</p> 
    {#if onReject && textReject}
        <button on:click={onReject}>{textReject}</button>
    {/if}
</div>