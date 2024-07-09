<script lang="ts">
	import { getTopTasks } from "./backend";
	import { targetLang } from "$lib/stores";
	import DocPreviewComponent from "./DocPreviewComponent.svelte";

    export let filter = {}

    let docs: any[][] = []
</script>

{#await getTopTasks($targetLang, filter) then docs}
    {#each docs as docId_doc}
        <DocPreviewComponent docId={docId_doc[0]} doc={docId_doc[1]}/>    
    {/each}
{/await}