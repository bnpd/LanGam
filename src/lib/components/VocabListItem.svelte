<script lang="ts" defer>
    export let title: string | undefined = undefined;
</script>

<div class="card">
    {#if title}
        <h4>{title}</h4>        
    {/if}
    <slot></slot>
</div>