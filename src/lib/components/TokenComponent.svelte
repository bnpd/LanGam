<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<script lang="ts">
    export let word: string;
    export let isFailed: boolean;
    export let isSrWord: boolean = false;
    export let isClickable: boolean;
</script>

{#if isClickable}
<span style:display="inline-block" class={'pointer span-'+word + (isFailed ? ' clicked' : isSrWord ? ' srWord' : '')} on:click>
    {#if isFailed}
    <a href={'langki://word/?w='+word}>📕</a>
    {/if}
    {word}
</span>
{:else}
{word}
{/if}
