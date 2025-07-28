<script lang="ts" defer>
  import { getUserLang } from "$lib/components/backend.js"
  import { username } from '$lib/stores';
  import '../global.css';
  import './lists.css';
  import TitleWithBackgroundImageComponent from "$lib/components/TitleWithBackgroundImageComponent.svelte";
  import VocabListItem from "$lib/components/VocabListItem.svelte";
  import NavbarComponent from "$lib/components/NavbarComponent.svelte";
  import SrComponent from "$lib/components/SrComponent.svelte";
  import { isLoggedIn } from '$lib/components/backend';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { PUBLIC_POCKETBASE_URL } from "$env/static/public";
  import { page } from '$app/stores';

let scheduledTokens: {[key: string]: any} = {}
let usedTokens: {[key: string]: string[]} = {}
let seenTokens: {[key: string]: string[]} = {}
let showAllWords = false

onMount(() => {
// Check if the user is logged in
if (!isLoggedIn()) {
    setTimeout(() => {
        // Wait for 0.1 second before redirecting
        goto('/login');
    }, 100);
}
});

// /// Functions ///

/**
 * Reload (or load initially) both lists
 */
async function loadVocabLists() {
  // remove previous content
  scheduledTokens = {}
  seenTokens = {}

  // load lists
  const user_lang = await getUserLang($username, $page.data?.targetLang.id)
  scheduledTokens = user_lang.sr_words
  usedTokens = user_lang.used_words
  seenTokens = user_lang.seen_words
  showAllWords = true
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
  <link rel="preconnect" href={PUBLIC_POCKETBASE_URL}>
</svelte:head>

<TitleWithBackgroundImageComponent>Your vocab</TitleWithBackgroundImageComponent>
<SrComponent />
{#if showAllWords}
  <div class="flex-row">
    <!-- {#if Object.keys(scheduledTokens)?.length}    
      <div class="vocab-column">
        <h3>
          Spaced Repetition
          <span>{Object.keys(scheduledTokens).length ? "("+Object.keys(scheduledTokens).length+" words)" : ""}</span>
        </h3>
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
      <h3>
        Used in chat
        <span>{Object.keys(usedTokens).length ? "("+Object.keys(usedTokens).length+" words)" : ""}</span>
      </h3>
      <div>
        {#each Object.keys(usedTokens) as key}
          <VocabListItem>
            {usedTokens[key].join(', ')}
          </VocabListItem>
        {/each}
      </div>
    </div>
    <div class="vocab-column">
      <h3>
        Seen
        <span>{Object.keys(seenTokens).length ? "("+Object.keys(seenTokens).length+" families)" : ""}</span>
      </h3>
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
{:else}
  <button on:click={loadVocabLists}>List all seen words</button>
{/if}
  
<NavbarComponent>
  <button on:click={()=>{history.back()}}>◄ Back</button>
</NavbarComponent>