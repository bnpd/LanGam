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
    outcomes: {
      default: {
        goto: 0,
        text: '',
        title: ''
      }
    },
    question: {
      lang: '',
      text: '',
      tokens: {}
    },
    seq_id: 0,
    suggested_replies: [],
    system_prompt: '',
    text: {
      lang: '',
      text: ''
    },
    title: {
      lang: '',
      text: ''
    }
  };

  export let selectedGame = '';
  let games = [];

  $: if (selectedGame) {
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
</style>

<form on:submit|preventDefault={submitChapter}>
  <label>
    Game:
    <select bind:value={chapter.game}>
      <option value="" disabled>Select a game</option>
      {#each games as game}
        <option value={game.id} selected={game.id === selectedGame}>{game.name}</option>
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
    Title:
    <input type="text" bind:value={chapter.title.text} />
  </label>
  <label>
    Text:
    <textarea bind:value={chapter.text.text}></textarea>
  </label>
  <button type="submit">Submit Chapter</button>
</form>