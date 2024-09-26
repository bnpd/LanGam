<script lang="ts" defer>
import type Token from "$lib/Token";
import { getVocab } from "$lib/components/backend.js"
import { targetLang } from '$lib/stores';
	import { onMount } from "svelte";
import '../global.css';
import './lists.css';
	import { goto } from "$app/navigation";
	import TitleWithBackgroundImageComponent from "$lib/components/TitleWithBackgroundImageComponent.svelte";
	import VocabListItem from "$lib/components/VocabListItem.svelte";
	import NavbarComponent from "$lib/components/NavbarComponent.svelte";
	import BadgeComponent from "$lib/components/BadgeComponent.svelte";
	import config from '../../config';

let scheduledTokens: {[key: string]: Token} = {}
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
  getVocab($targetLang).then(vocab => {
      let scheduledMap, allFormsMap
      [scheduledMap, allFormsMap] = [...vocab]
      scheduledTokens = scheduledMap
      seenTokens = allFormsMap
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
	<title>Your Vocabulary - Automated Language Learning AI</title>
  <meta name="description" content="Overview of your learned words - learn languages the fun way: talk about texts with AI.">
  <link rel="preconnect" href={config.backend}>
</svelte:head>

<TitleWithBackgroundImageComponent>Your vocab</TitleWithBackgroundImageComponent>
<div>
  <div id="divLeft">
    <!--<button id="btnExportSRList" on:click={() => exportObject(scheduledTokens, 'Spaced Repetition Words')}>Export</button>-->
    <h1>
      Spaced Repetition
      <span>{Object.keys(scheduledTokens).length ? "("+Object.keys(scheduledTokens).length+" words)" : ""}</span>
    </h1>
    <div id="ulSearchList">
      {#each Object.keys(scheduledTokens) as key}
        <VocabListItem title={scheduledTokens[key].word} >
          <BadgeComponent text='AI' tooltip="Estimate when you are likely to forget it, according to Spaced Repetition science. We'll try to show it before that day."/>
          Due: {Math.min(9999, scheduledTokens[key]?.interval)}&nbsp;d
        </VocabListItem>
      {/each}  
    </div>
  </div>
  <div id="divRight">
    <!--<button id="btnExportSeenList" on:click={() => exportObject(seenTokens, 'Seen Words')}>Export</button>-->
    <h1>
      Seen
      <span>{Object.keys(seenTokens).length ? "("+Object.keys(seenTokens).length+" families)" : ""}</span>
    </h1>
    <div id="ulKnownList">
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
  <button on:click={history.back}>◄ Back</button>
</NavbarComponent>