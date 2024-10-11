<script lang="ts" defer>
    import DocumentC from "$lib/DocumentC";
	import { isTaskCached } from "./backend";
	import { targetLang, username } from "$lib/stores";
	import BadgeComponent from "./BadgeComponent.svelte";
	import { onMount } from "svelte";

    let FALLBACK_IMAGE = '/images/illustrations/placeholder.avif'

    //export let img: ; // included in DocumentC?
    export let docId: number;
    export let doc: DocumentC;
    let hidden = false

    async function onOffline() {
        hidden = ! await isTaskCached($targetLang, docId.toString())
    }

    onMount(async ()=>{
        hidden = !navigator.onLine && ! await isTaskCached($targetLang, docId.toString());
    })

</script>

<svelte:window on:offline={onOffline} on:online={()=>{hidden = false}}></svelte:window>
<div class="image-card" hidden={hidden}>
    <a href={$username ? "/read?doc="+docId : "/signup"}>
        <div style:position="relative">
            <img 
                src={doc.img ? `/images/illustrations/${doc.img}.avif` : FALLBACK_IMAGE} 
                loading="lazy"
                alt={doc.title.text.replaceAll('#', '') + " Image"} 
                style:opacity={doc.img ? 'unset' : '0.1'}>
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
