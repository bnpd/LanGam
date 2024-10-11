<script lang="ts" defer>
  import '../global.css'
  import config from '$lib/../config.js';
	import { onMount } from 'svelte';
	import { getGames } from '$lib/components/backend';
	import { error } from '@sveltejs/kit';
	import { targetLang, username } from '$lib/stores';
	import TitleWithBackgroundImageComponent from '$lib/components/TitleWithBackgroundImageComponent.svelte';
	import NavbarComponent from '$lib/components/NavbarComponent.svelte';
	import { goto } from '$app/navigation';

  let FALLBACK_IMAGE = '/images/illustrations/placeholder.avif'

  let games: any[]

  onMount(async () => {
    if (!$username || !$targetLang) {
        goto('/signup')
    }
    games = await getGames($targetLang)
  
    if (!games) throw error(405);
  })
</script>

<svelte:head>
	<title>Games - Automated Language Learning AI</title>
  <meta name="description" content="Games - learn languages like play.">
  <link rel="preconnect" href={config.backend}>
</svelte:head>

{#if games}
<TitleWithBackgroundImageComponent>Games</TitleWithBackgroundImageComponent>
  <div class="two-columns">
    {#each games as game}
      <div class="image-card">
          <a href={$username ? "/game?gameId="+game.id : "/signup"}>
              <div style:position="relative">
                  <img 
                      src={game.img ? `/images/illustrations/${game.img}.avif` : FALLBACK_IMAGE} 
                      loading="lazy"
                      alt={game.name + " Image"}
                      style:opacity={game.img ? 'unset' : '0.1'}>
                  <!--<div class="difficulty-badge">
                      <BadgeComponent 
                          text={doc.difficulty > 5 ? 'advanced' : doc.difficulty < 4 ? 'beginner' : 'intermediate'} 
                          backgroundColor={doc.difficulty > 5 ? 'orange' : doc.difficulty < 4 ? 'lightgreen' : 'lightblue'}/>
                  </div>-->
              </div>
              <div>
                  <h4 style='display: inline-block; margin-right: 10px'>{game.name}</h4>
              </div>
          </a>
      </div>
    {/each}
  </div>
{/if}
<br><br>
<NavbarComponent>
  <button on:click={()=>goto("/catalog")}>◄ Back</button>
</NavbarComponent>
