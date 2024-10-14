<script lang="ts" defer>
import type Token from "$lib/Token";
import { getUserLang } from "$lib/components/backend.js"
import { targetLang, username } from '$lib/stores';
	import { onMount } from "svelte";
import '../global.css';
import './lists.css';
	import { goto } from "$app/navigation";
	import TitleWithBackgroundImageComponent from "$lib/components/TitleWithBackgroundImageComponent.svelte";
	import VocabListItem from "$lib/components/VocabListItem.svelte";
	import NavbarComponent from "$lib/components/NavbarComponent.svelte";
	import BadgeComponent from "$lib/components/BadgeComponent.svelte";
	import config from '../../config';

let scheduledTokens: {[key: string]: any} = {}
let usedTokens: {[key: string]: string[]} = {}
let seenTokens: {[key: string]: string[]} = {}
onMount(() => {
  reloadLists()
})

// /// Functions ///

/**
 * Reload (or load initially) both lists
 */
function reloadLists() {
  // remove previous content
  scheduledTokens = {}
  seenTokens = {}

  // load lists
  getUserLang($username, $targetLang).then(user_lang => {
      scheduledTokens = user_lang.sr_words
      usedTokens = user_lang.used_words
      seenTokens = user_lang.seen_words
  })
}

/**
 * Export list as file download
 * @param {any} content knownList / searchList
 * @param {string} filename How the exported file should be called
 */
// function exportObject(content: any, filename: string) {
//         // create download link, click it and remove it
//         const element = document.createElement('a')
//         element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(content)))
//         element.setAttribute('download', filename)
//         element.style.display = 'none'
//         document.body.appendChild(element)
//         element.click()
//         document.body.removeChild(element)
// }
</script>

<svelte:head>
	<title>Your Vocabulary - LanGam CYOA - language learning "choose you own adventure" game</title>
  <meta name="description" content='Overview of your learned words - LanGam CYOA - language learning "choose you own adventure" game.'>
  <link rel="preconnect" href={config.backend}>
</svelte:head>

<TitleWithBackgroundImageComponent>Your vocab</TitleWithBackgroundImageComponent>
<div class="flex-row">
  <!-- {#if Object.keys(scheduledTokens)?.length}    
    <div class="vocab-column">
      <h1>
        Spaced Repetition
        <span>{Object.keys(scheduledTokens).length ? "("+Object.keys(scheduledTokens).length+" words)" : ""}</span>
      </h1>
      <div>
        {#each Object.keys(scheduledTokens) as key}
          <VocabListItem title={scheduledTokens[key].word} >
            <BadgeComponent text='AI' tooltip="Estimate when you are likely to forget it, according to Spaced Repetition science. We'll try to show it before that day."/>
            Due: {Math.min(9999, scheduledTokens[key]?.interval)}&nbsp;d
          </VocabListItem>
        {/each}  
      </div>
    </div>
  {/if} -->
  <div class="vocab-column">
    <h1>
      Used in chat
      <span>{Object.keys(usedTokens).length ? "("+Object.keys(usedTokens).length+" words)" : ""}</span>
    </h1>
    <div>
      {#each Object.keys(usedTokens) as key}
        <VocabListItem>
          {usedTokens[key].join(', ')}
        </VocabListItem>
      {/each}
    </div>
  </div>
  <div class="vocab-column">
    <h1>
      Seen
      <span>{Object.keys(seenTokens).length ? "("+Object.keys(seenTokens).length+" families)" : ""}</span>
    </h1>
    <div>
      {#each Object.keys(seenTokens) as key}
        <VocabListItem>
          {seenTokens[key].join(', ')}
        </VocabListItem>
      {/each}  
    </div>
  </div>
</div>
<br><br>
<NavbarComponent>
  <button on:click={()=>{history.back()}}>◄ Back</button>
</NavbarComponent>