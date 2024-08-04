<script lang="ts">
    import DocumentC from "$lib/DocumentC";
	import { isTaskCached } from "./backend";
	import { targetLang, user } from "$lib/stores";

    //export let img: ; // included in DocumentC?
    export let docId: number;
    export let doc: DocumentC;

    let offline = !navigator.onLine;
</script>

<svelte:window on:offline={()=>{offline = true}} on:online={()=>{offline = false}}></svelte:window>
{#if offline}
    {#await isTaskCached($targetLang, docId.toString()) then available}
        {#if available}
            <a href={$user ? "/?doc="+docId : "/signup"}>
                <h4>
                    {doc.title.text.replaceAll('#', '')}
                </h4>
                {#if doc.img}
                    <img src={doc.img} alt={doc.title.text.replaceAll('#', '') + " Image"}>
                {/if}
            </a>
        {/if}
    {/await}
{:else}
    <a href={$user ? "/?doc="+docId : "/signup"}>
        <h4>
            {doc.title.text.replaceAll('#', '')}
        </h4>
        {#if doc.img}
            <img src={doc.img} alt={doc.title.text.replaceAll('#', '') + " Image"}>
        {/if}
    </a>
{/if}
