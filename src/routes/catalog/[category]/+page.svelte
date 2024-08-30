<script lang="ts" defer>
  import '../../global.css'
  import config from '$lib/../config.js';
	import DocPreviewComponent from '$lib/components/DocPreviewComponent.svelte';
	import { onMount } from 'svelte';
	import { getTopTasks } from '$lib/components/backend';
	import { error } from '@sveltejs/kit';
	import { targetLang } from '$lib/stores';
	import { page } from '$app/stores';
	import TitleWithBackgroundImageComponent from '$lib/components/TitleWithBackgroundImageComponent.svelte';
	import NavbarComponent from '$lib/components/NavbarComponent.svelte';
	import { goto } from '$app/navigation';

  let docs: any[][]
  let category_name: string

  onMount(async () => {

    const filter: {[key: string]: string} = {}
    
    const key_value = $page.params.category.split(';', 2)
    if (key_value.length != 2) throw error(404)
    category_name = key_value[1].replaceAll(',', ', ')
    filter[key_value[0]] = key_value[1]

    docs = await getTopTasks($targetLang, filter)
  
    if (!docs) throw error(405);
    
    docs.sort((el1, _el2) => el1[1].img ? -1 : 1)  // sort elements with img to the front (in place)
  })
</script>

<svelte:head>
	<title>{category_name} - Automated Language Learning AI</title>
  <meta name="description" content="Texts in the {category_name} category - learn languages the fun way: talk about texts with AI.">
  <link rel="preconnect" href={config.backend}>
</svelte:head>

{#if category_name && docs}
<TitleWithBackgroundImageComponent>{category_name}</TitleWithBackgroundImageComponent>
  <div class="two-columns">
    {#each docs as docId_doc}
    <div>
        <DocPreviewComponent docId={docId_doc[0]} doc={docId_doc[1]}/>    
    </div>
    {/each}
  </div>
{/if}
<br><br>
<NavbarComponent>
  <button on:click={()=>goto("/catalog")}>◄ Back</button>
</NavbarComponent>
