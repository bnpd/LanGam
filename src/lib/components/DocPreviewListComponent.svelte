<script lang="ts">
	import { onMount } from "svelte";
	import { getTopTasks } from "./backend";
	import { user } from "$lib/stores";
	import DocPreviewComponent from "./DocPreviewComponent.svelte";

    export let filter = {}

    let docs: any[][] = []
</script>

{#await getTopTasks($user, filter) then docs}
    {#each docs as docId_doc}
        <DocPreviewComponent docId={docId_doc[0]} doc={docId_doc[1]}/>    
    {/each}
{/await}