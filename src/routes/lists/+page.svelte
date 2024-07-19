<script lang="ts">
import type Token from "$lib/Token";
import { getVocab } from "$lib/components/backend.js"
import { targetLang } from '$lib/stores';
	import { onMount } from "svelte";
import '../global.css';
import './lists.css';
	import { goto } from "$app/navigation";

let scheduledTokens: {[key: string]: Token} = {}
let seenTokens: {[key: string]: string} = {}
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
 function exportObject(content: any, filename: string) {
        // create download link, click it and remove it
        const element = document.createElement('a')
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(content)))
        element.setAttribute('download', filename)
        element.style.display = 'none'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
}
</script>

<svelte:head>
	<title>Your Vocabulary - Automated Language Learning AI</title>
  <meta name="description" content="Overview of your learned words - learn languages the fun way: talk about texts with AI.">
</svelte:head>

<div>
  <div id="divLeft">
    <button id="btnExportSearchList" on:click={() => exportObject(scheduledTokens, 'Spaced Repetition Words')}>Export</button>
    <h1>
      Spaced Repetition
    </h1>
    <ul id="ulSearchList">
      {#each Object.keys(scheduledTokens) as key}
      <li>{scheduledTokens[key].word + ": " + scheduledTokens[key].due?.day + "." + scheduledTokens[key].due?.month + "." + scheduledTokens[key].due?.year}</li>
      {/each}  
    </ul>
  </div>
  <div id="divRight">
    <button on:click={()=>goto("/")}>◄ Back</button>
    <h1>
      Seen
      <span id="spanNKnown">{Object.keys(seenTokens).length ? "("+Object.keys(seenTokens).length+" lemmas)" : ""}</span>
    </h1>
    <ul id="ulKnownList">
      {#each Object.keys(scheduledTokens) as key}
      <li>{key + ": " + seenTokens[key]}</li>
      {/each}  
    </ul>
  </div>
</div>