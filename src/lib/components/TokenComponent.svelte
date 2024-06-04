<script lang="ts">
    export let word: string;
    export let isFailed: boolean;
    export let isClickable: boolean;
</script>

{#if isClickable}
<span style:display="inline-block" class={'pointer span-'+word + (isFailed ? ' clicked' : '')} on:click>
    {#if isFailed}
    <a href={'langki://word/?w='+word}>📕</a>
    {/if}
    {word}
</span>
{:else}
{word}
{/if}
