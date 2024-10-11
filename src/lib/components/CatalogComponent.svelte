<script lang="ts" defer>
	import { getTask } from "./backend";
	import { targetLang, username } from "$lib/stores";
	import DocPreviewComponent from "./DocPreviewComponent.svelte";
	import BadgeComponent from "./BadgeComponent.svelte";
	import TitleWithBackgroundImageComponent from "./TitleWithBackgroundImageComponent.svelte";
	import NavbarComponent from "./NavbarComponent.svelte";
	import { goto } from "$app/navigation";

    let content_types: Array<{title: string; filter: {[filter: string]: string[]}}> = [
        {title: 'Extra Short', filter: {content_type: ['Extra short']}},
        {title: 'Short Stories', filter: {content_type: ['Story']}},
        {title: 'Long Stories', filter: {content_type: ['Long Story']}},
        {title: 'Articles', filter: {content_type: ['Article']}}
    ]

    let topics: Array<{title: string; filter: {[filter: string]: string[]}}> = [
        {title: 'About Friendship', filter: {topic: ['Friendship']}},
        {title: 'Hobbies & Food', filter: {topic: ['Hobbies', 'Food']}},
        {title: 'About Work', filter: {topic: ['Work']}},
        {title: 'Adventures', filter: {topic: ['Adventure']}},
        {title: 'Learning', filter: {topic: ['Learning']}},
        {title: 'Polish Culture', filter: {topic: ['Culture']}},
        {title: 'Seaside Bliss', filter: {topic: ['Seaside Bliss']}},
        {title: 'Village Life', filter: {topic: ['Village Life']}},
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
{#if $username}
    {#if !offline}
        {#await getTask($targetLang) then doc}
            <h2>
                <BadgeComponent text='AI' tooltip='This text optimizes the amount of words that are due for spaced repetition to help you keep your vocabulary fresh.'/>
                Recommended: 
            </h2>
            <DocPreviewComponent docId={doc.docId} doc={doc}/> 
        {/await}
        <a href="/games">
            <div class="card">
                <h3 style="margin-bottom: 0">Games</h3>
            </div>
        </a>
    {/if}
{:else}
    <div class="card">
        <h2>
            <BadgeComponent text='AI' tooltip='This text optimizes the amount of words that are due for spaced repetition to help you keep your vocabulary fresh.'/>
            Recommended: 
            <a href="/read"><h4>Waht AlAli cna do for yuo</h4></a>
        </h2>
        <p>Create an account so we can save your progress when you read any of the following stories:</p>
    </div>
{/if}
<h2>Categories</h2>
<div style:opacity={$username ? '1' : '0.3'} class="two-columns">
    {#each content_types as filter}
        {@const key = Object.keys(filter.filter)[0]}
            <a href="/catalog/{key};{filter.filter[key]}">
                <div class="card">
                    <h3 style="margin-bottom: 0">{filter.title}</h3>
                </div>
            </a>
    {/each}
</div>
<h2>Topics</h2>
<div style:opacity={$username ? '1' : '0.3'} class="two-columns">
    {#each topics as filter}
        {@const key = Object.keys(filter.filter)[0]}
            <a href="/catalog/{key};{filter.filter[key]}">
                <div class="card">
                    <h3 style="margin-bottom: 0">{filter.title}</h3>
                </div>
            </a>
    {/each}
</div>
<br><br>
<NavbarComponent>
  <button on:click={()=>goto("/read")}>◄ Back</button>
</NavbarComponent>