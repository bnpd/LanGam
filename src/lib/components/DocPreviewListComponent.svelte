<script lang="ts">
	import { onMount } from "svelte";
	import { getTopTasks } from "./backend";
	import { user } from "$lib/stores";
	import DocPreviewComponent from "./DocPreviewComponent.svelte";

    let docs: any[][] = []

    onMount(async () => {
        docs = await getTopTasks($user, {topic: 'Adventure'})
    })
</script>

{#each docs as docId_doc}
    <DocPreviewComponent docId={docId_doc[0]} doc={docId_doc[1]}/>    
{/each}