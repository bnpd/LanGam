<script lang="ts">
    export let word: string;
    export let isFailed: boolean;
    export let isClickable: boolean;
</script>
{#if isFailed}
<a href={'langki://word/?w='+word} class={'a-'+word}>📕</a>
{/if}
{#if isClickable}
<span class={'pointer span-'+word + (isFailed && ' clicked')} on:click>{word}</span>
{:else}
{word}
{/if}
