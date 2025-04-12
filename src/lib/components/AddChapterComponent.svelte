<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
	import { onMount } from 'svelte';
  import { createChapter, getOwnGames, isLoggedIn } from './backend';

  onMount(() => {
// Check if the user is logged in
if (!isLoggedIn()) {
    setTimeout(() => {
        // Wait for 0.1 second before redirecting
        goto('/login');
    }, 100);
}
});

  let chapter = {
    character: '',
    game: '',
    img: '',
    outcomes: {},
    question: {
      lang: 'pl',
      text: ''
    },
    seq_id: 0,
    suggested_replies: [],
    system_prompt: '',
    text: {
      lang: 'pl',
      text: ''
    },
    title: {
      lang: 'pl',
      text: ''
    }
  };

  let games = [];
  let selectedGame = '';

  $: if ($page.url.searchParams.has('game')) {
    selectedGame = $page.url.searchParams.get('game');
    chapter.game = selectedGame;
  }

  async function loadGames() {
    try {
      games = await getOwnGames();
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  }

  loadGames();

  function addOutcome() {
    const key = `outcome_${Object.keys(chapter.outcomes).length + 1}`;
    chapter.outcomes[key] = {
      goto: 0,
      stats: {},
      text: '',
      title: ''
    };
  }

  function removeOutcome(key) {
    delete chapter.outcomes[key];
  }

  async function submitChapter() {
    try {
      const createdChapter = await createChapter(chapter);
      console.log('Chapter created:', createdChapter);
      goto('/');
    } catch (error) {
      console.error('Error creating chapter:', error);
    }
  }
</script>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  label {
    font-weight: bold;
  }

  input, textarea, select {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
  }

  button {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    background-color: #007BFF;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }

  button:hover {
    background-color: #0056b3;
  }

  .collapsible {
    border: 1px solid #ccc;
    padding: 1rem;
    border-radius: 5px;
  }
</style>

<form on:submit|preventDefault={submitChapter}>
  <label>
    Game:
    <select bind:value={chapter.game}>
      <option value="" disabled>Select a game</option>
      {#each games as game}
        <option value={game.id} selected={game.id === selectedGame}>{game.name} ({game.lang})</option>
      {/each}
    </select>
  </label>
  <label>
    Character:
    <input type="text" bind:value={chapter.character} />
  </label>
  <label>
    Image URL:
    <input type="text" bind:value={chapter.img} />
  </label>
  <label>
    Sequence ID:
    <input type="number" bind:value={chapter.seq_id} />
  </label>
  <label>
    System Prompt:
    <textarea bind:value={chapter.system_prompt}></textarea>
  </label>

  <div class="collapsible">
    <h3>Outcomes</h3>
    {#each Object.entries(chapter.outcomes) as [key, outcome]}
      <div>
        <label>
          Outcome Key: {key}
        </label>
        <label>
          Goto:
          <input type="number" bind:value={outcome.goto} />
        </label>
        <label>
          Stats (JSON):
          <textarea bind:value={outcome.stats}></textarea>
        </label>
        <label>
          Text:
          <textarea bind:value={outcome.text}></textarea>
        </label>
        <label>
          Title:
          <input type="text" bind:value={outcome.title} />
        </label>
        <button type="button" on:click={() => removeOutcome(key)}>Remove Outcome</button>
      </div>
    {/each}
    <button type="button" on:click={addOutcome}>Add Outcome</button>
  </div>

  <div class="collapsible">
    <label>
      Title:
      <input type="text" bind:value={chapter.title.text} />
    </label>
  </div>

  <div class="collapsible">
    <label>
      Text:
      <textarea bind:value={chapter.text.text}></textarea>
    </label>
  </div>

  <div class="collapsible">
    <label>
      Question:
      <textarea bind:value={chapter.question.text}></textarea>
    </label>
    
      <label>
        Suggested Replies (Comma-separated):
        <input type="text" bind:value={chapter.suggested_replies} />
      </label>
  </div>

  <button type="submit">Submit Chapter</button>
</form>