<script lang="ts">
    export let fields: {id: string, name: string, value?: string}[]
    export let submitOptions: {text: string, handler: (formdata: { [x: string]: string | undefined; }) => void}
</script>

{#if fields}
    <form>
        {#each fields as field}
            <div contenteditable id={field.id} data-placeholder={field.name}>{field?.value ?? ''}</div>
        {/each}
        {#each submitOptions as submitOption}
            <input type="submit" value={submitOption.text} on:click|preventDefault={()=>{submitOption.handler(fields.reduce((acc, field) => {acc[field.id] = document.getElementById(field.id)?.innerText; return acc}, {}))}}>
        {/each}
    </form>
{/if}
