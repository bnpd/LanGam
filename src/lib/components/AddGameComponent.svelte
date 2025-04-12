<script lang="ts">
  import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
  import { createGame, isLoggedIn } from './backend';

onMount(() => {
// Check if the user is logged in
if (!isLoggedIn()) {
    setTimeout(() => {
        // Wait for 0.1 second before redirecting
        goto('/login');
    }, 100);
}
});

  let game = {
    name: '',
    lang: '',
    img: ''
  };

  async function submitGame() {
    try {
      const createdGame = await createGame(game);
      console.log('Game created:', createdGame);
      goto(`/new?game=${createdGame.game.id}`);
    } catch (error) {
      console.error('Error creating game:', error);
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

  input, select {
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

<form on:submit|preventDefault={submitGame}>
  <label>
    Name:
    <input type="text" bind:value={game.name} />
  </label>
  <label>
    Language:
    <select bind:value={game.lang}>
      <option value="" disabled>Select a language</option>
      <option value="en">English</option>
      <option value="pl">Polish</option>
    </select>
  </label>
  <label>
    Image URL:
    <input type="text" bind:value={game.img} />
  </label>
  <button type="submit">Submit Game</button>
</form>