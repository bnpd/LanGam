<script lang="ts">
    import DocumentC from "$lib/DocumentC";
	import { isTaskCached } from "./backend";
	import { targetLang, user } from "$lib/stores";
	import BadgeComponent from "./BadgeComponent.svelte";
	import { onMount } from "svelte";

    let FALLBACK_IMAGE = '/images/illustrations/_d835551b-5ef3-409e-b051-c5e56274fd15.avif'

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

<style>
    .image-card img {
    margin-top: calc(-1 * var(--padding-card));
    margin-left: calc(-1 * var(--padding-card));
    margin-bottom: calc(0.5 * var(--padding-card));
    width: calc(100% + 2 * var(--padding-card));
    border-radius: var(--card-border-radius) var(--card-border-radius) 0 0;
    }

    .difficulty-badge {
        position: absolute;
        bottom: 1.5em;
        z-index: 1;
    }
</style>

<svelte:window on:offline={onOffline} on:online={()=>{hidden = false}}></svelte:window>
<div class="image-card" hidden={hidden}>
    <a href={$user ? "/?doc="+docId : "/signup"}>
        <div style:position="relative">
            <img src={doc.img ? `/images/illustrations/${doc.img}.avif` : FALLBACK_IMAGE} alt={doc.title.text.replaceAll('#', '') + " Image"} style:opacity={doc.img ? 'unset' : '0.1'}>
            <div class="difficulty-badge">
                <BadgeComponent 
                    text={doc.difficulty > 5 ? 'advanced' : doc.difficulty < 4 ? 'beginner' : 'intermediate'} 
                    backgroundColor={doc.difficulty > 5 ? 'orange' : doc.difficulty < 4 ? 'lightgreen' : 'lightblue'}/>
            </div>
        </div>
        <div>
            <h4 style='display: inline-block; margin-right: 10px'>{doc.title.text.replaceAll('#', '')}</h4>
        </div>
    </a>
</div>
