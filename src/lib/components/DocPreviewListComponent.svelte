<script lang="ts" defer>
	import { getTopTasks } from "./backend";
	import { targetLang } from "$lib/stores";
	import DocPreviewComponent from "./DocPreviewComponent.svelte";

    export let filter = {}

    let docs: any[][] = []
</script>

<style>
    .two-columns {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
    }

    .two-columns > * {
        width: 50%;
        box-sizing: border-box;
        padding: 5px;
    }
</style>

<div class="two-columns">
    {#await getTopTasks($targetLang, filter) then docs}
        {@const _sortres = docs.sort((el1, el2) => el1[1].img ? -1 : 1)} <!-- sort elements with img to the front (in place)-->
        {#each docs as docId_doc}
        <div>
            <DocPreviewComponent docId={docId_doc[0]} doc={docId_doc[1]}/>    
        </div>
        {/each}
    {/await}
</div>