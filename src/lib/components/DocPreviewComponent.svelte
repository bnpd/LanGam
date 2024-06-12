<script lang="ts">
    import DocumentC from "$lib/DocumentC";
	import { onMount } from "svelte";
	import { isTaskCached } from "./backend";
	import { user } from "$lib/stores";

    //export let img: ; // included in DocumentC?
    export let docId: number;
    export let doc: DocumentC;

    let offline = false

</script>

<svelte:window on:offline={()=>{offline = true}} on:online={()=>{offline = false}}></svelte:window>
{#if offline}
    {#await isTaskCached($user, docId.toString()) then available}
        {#if available}
            <a href={"/?doc="+docId}>
                <h4>
                    {doc.title.text}
                </h4>
                {#if doc.img}
                    <img src={doc.img} alt={doc.title.text + "Image"}>
                {/if}
            </a>
        {/if}
    {/await}
{:else}
    <a href={"/?doc="+docId}>
        <h4>
            {doc.title.text}
        </h4>
        {#if doc.img}
            <img src={doc.img} alt={doc.title.text + "Image"}>
        {/if}
    </a>
{/if}
