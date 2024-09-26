<script lang="ts">
	import { onMount } from "svelte";
    import '../global.css'

    let errors: string[] = []

    onMount(()=>{
        errors = JSON.parse(localStorage.getItem('errors') ?? '[]')
        console.log(errors);
        
    })
</script>

{#if errors?.length} 
    {#each errors as error}
        <div class="card" style="white-space: pre-wrap;">
            {error}
        </div>
    {/each}
{:else}
    Nothing to see here
{/if}