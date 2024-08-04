<script lang="ts">
	import { getTask } from "./backend";
	import { targetLang, user } from "$lib/stores";
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
        <em>📴line</em>
    {/if}
    Catalog
</h1>
{#if $user}
    {#if !offline}
        {#await getTask($targetLang) then doc}
            <em class='forceOneLine'>
                <BadgeComponent text='AI' tooltip='This text optimizes the amount of words that are due for spaced repetition to help you keep your vocabulary fresh.'/>
                Recommended: 
                <DocPreviewComponent docId={doc.docId} doc={doc}/> 
            </em>
        {/await}
    {/if}
{:else}
    <em class='forceOneLine'>
        <BadgeComponent text='AI' tooltip='This text optimizes the amount of words that are due for spaced repetition to help you keep your vocabulary fresh.'/>
        Recommended: 
        <a href="/"><h4>Waht AlAli cna do for yuo</h4></a>
    </em>
    <p>Create an account so we can save your progress when you read any of the following stories:</p>
{/if}
<div style:opacity={$user ? '1' : '0.3'}>
    {#each filters as filter}
        <h2>{filter.title}</h2>
        <DocPreviewListComponent filter={filter.filter}/>    
    {/each}
</div>