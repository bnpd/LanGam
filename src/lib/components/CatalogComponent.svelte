<script lang="ts" defer>
	import { getTask } from "./backend";
	import { targetLang, user } from "$lib/stores";
	import DocPreviewComponent from "./DocPreviewComponent.svelte";
	import BadgeComponent from "./BadgeComponent.svelte";
	import TitleWithBackgroundImageComponent from "./TitleWithBackgroundImageComponent.svelte";

    let filters: Array<{title: string; filter: {[filter: string]: string[]}}> = [
        {title: 'Extra Short', filter: {content_type: ['Extra short']}},
        {title: 'Short Stories', filter: {content_type: ['Story']}},
        {title: 'Long Stories', filter: {content_type: ['Long Story']}},
        {title: 'Articles', filter: {content_type: ['Article']}},
        {title: 'Adventures', filter: {topic: ['Adventure']}},
        {title: 'About Friendship', filter: {topic: ['Friendship']}},
        {title: 'About Work', filter: {topic: ['Work']}},
        {title: 'Village Life', filter: {topic: ['Village Life']}},
        {title: 'Seaside Bliss', filter: {topic: ['Seaside Bliss']}},
        {title: 'Hobbies & Food', filter: {topic: ['Hobbies', 'Food']}},
        {title: 'Learning', filter: {topic: ['Learning']}},
        {title: 'Polish Culture', filter: {topic: ['Culture']}},
    ]

    let offline = false

</script>

<svelte:window on:offline={()=>{offline = true}} on:online={()=>{offline = false}}></svelte:window>
<TitleWithBackgroundImageComponent>
    Your
    {#if offline}
        <em>📴line</em>
    {/if}
    Catalog
</TitleWithBackgroundImageComponent>
{#if $user}
    {#if !offline}
        {#await getTask($targetLang) then doc}
            <h2>
                <BadgeComponent text='AI' tooltip='This text optimizes the amount of words that are due for spaced repetition to help you keep your vocabulary fresh.'/>
                Recommended: 
            </h2>
            <DocPreviewComponent docId={doc.docId} doc={doc}/> 
        {/await}
    {/if}
{:else}
    <div class="card">
        <h2>
            <BadgeComponent text='AI' tooltip='This text optimizes the amount of words that are due for spaced repetition to help you keep your vocabulary fresh.'/>
            Recommended: 
            <a href="/"><h4>Waht AlAli cna do for yuo</h4></a>
        </h2>
        <p>Create an account so we can save your progress when you read any of the following stories:</p>
    </div>
{/if}
<div style:opacity={$user ? '1' : '0.3'}>
    <h2>Categories</h2>
    {#each filters as filter}
        {@const key = Object.keys(filter.filter)[0]}
        <h3>
            <a href="/catalog/{key};{filter.filter[key]}">{filter.title}</a>
        </h3>
    {/each}
</div>