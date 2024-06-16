<script lang="ts">
	import { onMount } from "svelte";
	import { getTask, getTopTasks } from "./backend";
	import { user } from "$lib/stores";
	import DocPreviewListComponent from "./DocPreviewListComponent.svelte";
	import DocPreviewComponent from "./DocPreviewComponent.svelte";
	import BadgeComponent from "./BadgeComponent.svelte";

    let filters: Array<{title: string; filter: {[filter: string]: string}}> = [
        {title: 'Short Stories', filter: {content_type: 'Story'}},
        {title: 'Long Stories', filter: {content_type: 'Long Story'}},
        {title: 'Articles', filter: {content_type: 'Article'}},
        {title: 'Adventures', filter: {topic: 'Adventure'}},
        {title: 'About Friendship', filter: {topic: 'Friendship'}},
        {title: 'About Work', filter: {topic: 'Work'}},
        {title: 'Polish Culture', filter: {topic: 'Culture'}},
    ]

    let offline = false

</script>

<svelte:window on:offline={()=>{offline = true}} on:online={()=>{offline = false}}></svelte:window>
<h1>
    Your
    {#if offline}
        Offline
    {/if}
    Catalog
</h1>
{#await getTask($user) then doc}
    <em class='forceOneLine'>
        <BadgeComponent text='AI' tooltip='This text optimizes the amount of words that are due for spaced repetition to help you keep your vocabulary fresh.'/>
        Recommended: 
        <DocPreviewComponent docId={doc.docId} doc={doc}/> 
    </em>
{/await}
{#each filters as filter}
    <h2>{filter.title}</h2>
    <DocPreviewListComponent filter={filter.filter}/>    
{/each}