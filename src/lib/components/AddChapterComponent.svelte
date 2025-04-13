<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
	import { onMount } from 'svelte';
  import { createChapter, getOwnGames, isLoggedIn } from './backend';
  import '../../routes/global.css';
	import TitleWithBackgroundImageComponent from './TitleWithBackgroundImageComponent.svelte';

  onMount(() => {
// Check if the user is logged in
if (!isLoggedIn()) {
    setTimeout(() => {
        // Wait for 0.5 second before redirecting
        goto('/login');
    }, 500);
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
    chapter.outcomes = {
      ...chapter.outcomes,
      [key]: {
        goto: 0,
        stats: {},
        text: '',
        title: ''
      }
    };
  }

  function removeOutcome(key) {
    const { [key]: _, ...remainingOutcomes } = chapter.outcomes;
    chapter.outcomes = remainingOutcomes;
  }

  function addSuggestedReply() {
    chapter.suggested_replies = [...chapter.suggested_replies, ''];
  }

  function removeSuggestedReply(index) {
    chapter.suggested_replies = chapter.suggested_replies.filter((_, i) => i !== index);
  }

  let successMessage = '';
  let errorMessage = '';

  async function submitChapter() {
    successMessage = '';
    errorMessage = '';

    try {
      const createdChapter = await createChapter(chapter);
      console.log('Chapter created:', createdChapter);

      // Set new seq_id to the first outcome's goto value
      const firstOutcomeKey = Object.keys(chapter.outcomes)[0];

      // Clear all fields
      chapter = {
        character: '',
        game: chapter.game, // Retain the selected game
        img: '',
        outcomes: {},
        question: {
          lang: 'pl',
          text: ''
        },
        seq_id: firstOutcomeKey ? chapter.outcomes[firstOutcomeKey].goto : 0,
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

      successMessage = 'Chapter submitted successfully!';
    } catch (error) {
      console.error('Error creating chapter:', error);
    //   if (error.message.includes('seq_id already exists')) {
        errorMessage = 'Error: This Sequence Id already exists for this game.';
    //   } else {
    //     errorMessage = 'An unexpected error occurred. Please try again.';
    //   }
    }
  }

  function addStat(outcomeKey) {
    const outcome = chapter.outcomes[outcomeKey];
    const newKey = `key_${Object.keys(outcome.stats).length + 1}`;
    if (!outcome.stats[newKey]) {
      outcome.stats = {
        ...outcome.stats,
        [newKey]: ''
      };
      chapter.outcomes = { ...chapter.outcomes, [outcomeKey]: outcome };
    }
  }

  function removeStat(outcomeKey, statKey) {
    const outcome = chapter.outcomes[outcomeKey];
    const { [statKey]: _, ...remainingStats } = outcome.stats;
    outcome.stats = remainingStats;
    chapter.outcomes = { ...chapter.outcomes, [outcomeKey]: outcome };
  }

  function updateStatKey(outcomeKey, oldKey, newKey) {
    const outcome = chapter.outcomes[outcomeKey];
    if (newKey && !outcome.stats[newKey]) {
      const { [oldKey]: value, ...remainingStats } = outcome.stats;
      outcome.stats = {
        ...remainingStats,
        [newKey]: value
      };
      chapter.outcomes = { ...chapter.outcomes, [outcomeKey]: outcome };
    }
  }

  function updateOutcomeKey(oldKey, newKey) {
    if (newKey && !chapter.outcomes[newKey]) {
      const { [oldKey]: value, ...remainingOutcomes } = chapter.outcomes;
      chapter.outcomes = {
        ...remainingOutcomes,
        [newKey]: value
      };
    }
  }
</script>

<TitleWithBackgroundImageComponent>Add Chapter</TitleWithBackgroundImageComponent>
<form on:submit|preventDefault={submitChapter}>
  <div class="card">
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
      Sequence ID:
      <input type="number" bind:value={chapter.seq_id} />
    </label>
    <label>
      System Prompt:
      <textarea bind:value={chapter.system_prompt}></textarea>
    </label>
  </div>

  <div class="card">
    <h3>Outcomes</h3>
    {#each Object.entries(chapter.outcomes) as [key, outcome]}
      <div>
        <label>
          Outcome Key:
          <input type="text" value={key} on:change={(e) => updateOutcomeKey(key, e.target.value)} />
        </label>
        <label>
          Goto:
          <input type="number" bind:value={outcome.goto} />
        </label>
        <label>
          Stats:
          {#each Object.entries(outcome.stats) as [statKey, statValue]}
            <div>
              <input type="text" value={statKey} on:change={(e) => updateStatKey(key, statKey, e.target.value)} />
              <input type="text" bind:value={outcome.stats[statKey]} />
              <button type="button" on:click={() => removeStat(key, statKey)}>Remove</button>
            </div>
          {/each}
          <button type="button" on:click={() => addStat(key)}>Add Stat</button>
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

  <div class="card">
    <h3>Suggested Replies</h3>
    {#each chapter.suggested_replies as reply, index}
      <div>
        <input type="text" bind:value={chapter.suggested_replies[index]} />
        <button type="button" on:click={() => removeSuggestedReply(index)}>Remove</button>
      </div>
    {/each}
    <button type="button" on:click={addSuggestedReply}>Add Reply</button>
  </div>

  <div class="card">
    <h3>Text and Title</h3>
    <label>
      Title:
      <input type="text" bind:value={chapter.title.text} />
    </label>
    <label>
      Text:
      <textarea bind:value={chapter.text.text}></textarea>
    </label>
    <label>
      Question:
      <textarea bind:value={chapter.question.text}></textarea>
    </label>
  </div>

  {#if successMessage}
    <div class="success-message">{successMessage}</div>
  {/if}

  {#if errorMessage}
    <div class="error-message">{errorMessage}</div>
  {/if}

  <button type="submit">Submit Chapter</button>
</form>
