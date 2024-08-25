<script lang="ts">
    import DocumentC from "$lib/DocumentC";
	import { isTaskCached } from "./backend";
	import { targetLang, user } from "$lib/stores";
	import BadgeComponent from "./BadgeComponent.svelte";
	import { onMount } from "svelte";

    //export let img: ; // included in DocumentC?
    export let docId: number;
    export let doc: DocumentC;
    let hidden = false
    $: if(doc && doc.img) console.log(doc.img);

    async function onOffline() {
        hidden = ! await isTaskCached($targetLang, docId.toString())
    }

    onMount(async ()=>{
        hidden = !navigator.onLine && ! await isTaskCached($targetLang, docId.toString());
    })

</script>

<svelte:window on:offline={onOffline} on:online={()=>{hidden = false}}></svelte:window>
    <div class="card" hidden={hidden}>
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
                <img src={`/images/illustrations/${doc.img}.avif`} alt={doc.title.text.replaceAll('#', '') + " Image"} width="100%">
                <hr>
            {/if}
        </a>
    </div>
