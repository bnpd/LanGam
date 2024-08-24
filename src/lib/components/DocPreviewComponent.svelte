<script lang="ts">
    import DocumentC from "$lib/DocumentC";
	import { isTaskCached } from "./backend";
	import { targetLang, user } from "$lib/stores";
	import BadgeComponent from "./BadgeComponent.svelte";

    //export let img: ; // included in DocumentC?
    export let docId: number;
    export let doc: DocumentC;
    $: if(doc && doc.img) console.log(doc.img);    

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
            <span style='max-width: 70%; display: inline-block'>{doc.title.text.replaceAll('#', '')}</span>
            <span style:float="right">
                <BadgeComponent 
                 text={doc.difficulty > 5 ? 'advanced' : doc.difficulty < 4 ? 'beginner' : 'intermediary'} 
                 backgroundColor={doc.difficulty > 5 ? 'orange' : doc.difficulty < 4 ? 'lightgreen' : 'lightblue'}/>
            </span>
        </h4>
        {#if doc.img}
            <img src={`/images/illustrations/${doc.img}.jpeg`} alt={doc.title.text.replaceAll('#', '') + " Image"} width="100%">
            <hr>
        {/if}
    </a>
{/if}
