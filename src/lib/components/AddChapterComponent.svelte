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

  // Form element references
  let formElement;
  let gameSelectRef;
  let characterRef;
  let imgRef;
  let seqIdRef;
  let systemPromptRef;
  let titleRef;
  let textRef;
  let questionRef;

  // Empty template for chapter structure
  const emptyChapter = {
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

  // References for suggested replies inputs
  let suggestedRepliesCount = 0;
  let suggestedReplyRefs = [];
  let suggestedReplyIndexes = [];
  // References for outcome elements
  let outcomeRefs = {};

  let games = [];
  let selectedGame = '';

  // Track temporary outcome keys that will be replaced on submit
  let tempOutcomeKeys = [];
  
  // Track stat keys for each outcome
  let outcomeStatKeys = [];

  $: if ($page.url.searchParams.has('game')) {
    selectedGame = $page.url.searchParams.get('game');
    if (gameSelectRef) {
      gameSelectRef.value = selectedGame;
    }
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
    const tempKey = `${tempOutcomeKeys.at(-1) ?? "outcome"}_prime`;
    tempOutcomeKeys = [...tempOutcomeKeys, tempKey];
    
    // Initialize references for the new outcome
    outcomeRefs[tempKey] = {
      title: null,
      goto: null,
      text: null,
      stats: {},
      statValues: {}
    };
    
    // Initialize stat keys array for this outcome
    outcomeStatKeys[tempKey] = [];
  }

  function removeOutcome(key) {
    tempOutcomeKeys = tempOutcomeKeys.filter(k => k !== key);
  }

  function addSuggestedReply() {
    // Generate a unique index for this reply
    const newIndex = suggestedRepliesCount++;
    
    // Add a new element to the arrays
    suggestedReplyRefs = [...suggestedReplyRefs, null];
    suggestedReplyIndexes = [...suggestedReplyIndexes, newIndex];
  }

  function removeSuggestedReply(index) {
    // Remove from both arrays to keep them in sync
    suggestedReplyRefs = [
      ...suggestedReplyRefs.slice(0, index),
      ...suggestedReplyRefs.slice(index + 1)
    ];
    
    suggestedReplyIndexes = [
      ...suggestedReplyIndexes.slice(0, index),
      ...suggestedReplyIndexes.slice(index + 1)
    ];
  }

  // Generate an outcome key from the title
  function generateOutcomeKey(title) {
    if (!title) return '';
    
    // Convert to lowercase, remove special characters, replace spaces with underscores
    return title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30); // Limit length
  }

  // Check if stats keys are unique within an outcome
  function validateStatsKeys(outcomeKey) {
    const statInputs = document.querySelectorAll(`input[id^="stat-key-${outcomeKey}"]`);
    const statKeys = new Set(Object.keys(outcomeRefs[outcomeKey].stats));
    
    if (statKeys.size !== statInputs.length) {
      // Find duplicates
      statInputs.values().forEach((input: HTMLInputElement) => {
        const value = input.value.trim();
        if (statKeys.has(value)) {
          statKeys.delete(value);
        } else if (value === '') {
          input.setCustomValidity(`Cannot be empty.`);
          input.reportValidity();
        } else {
          input.setCustomValidity(`Stat "${value}" is duplicated.`);
          input.reportValidity();
        }
      });
      return false;
    }
    
    return true;
  }

  let successMessage = '';
  let errorMessage = '';

  function addStat(outcomeKey) {
    if (!outcomeRefs[outcomeKey].stats) {
      outcomeRefs[outcomeKey].stats = {};
      outcomeRefs[outcomeKey].statValues = {};
      outcomeStatKeys[outcomeKey] = [];
    }
    
    const statCount = outcomeStatKeys[outcomeKey].length + 1;
    let newKey = `stat`;
    
    // Ensure the key is unique
    let counter = 0;
    while (outcomeStatKeys[outcomeKey].includes(newKey)) {
      counter++;
      newKey = `stat_${statCount + counter}`;
    }
    
    // Add reference holders for the new stat
    outcomeRefs[outcomeKey].stats[newKey] = null;
    outcomeRefs[outcomeKey].statValues[newKey] = null;
    
    // Add to the keys array to maintain order
    outcomeStatKeys[outcomeKey] = [...outcomeStatKeys[outcomeKey], newKey];
  }

  function removeStat(outcomeKey, statKey) {
    // Remove from the refs objects
    const { [statKey]: _, ...remainingStats } = outcomeRefs[outcomeKey].stats;
    const { [statKey]: __, ...remainingValues } = outcomeRefs[outcomeKey].statValues;
    
    outcomeRefs[outcomeKey].stats = remainingStats;
    outcomeRefs[outcomeKey].statValues = remainingValues;
    
    // Remove from the keys array to update the rendering
    outcomeStatKeys[outcomeKey] = outcomeStatKeys[outcomeKey].filter(k => k !== statKey);
  }

  function updateStatKey(outcomeKey, oldKey, newKey, inputElement) {
    if (newKey === '') {
      inputElement.setCustomValidity('Stat key cannot be empty');
      inputElement.reportValidity();
      return;
    }
    
    if (oldKey === newKey) {
      inputElement.setCustomValidity('');
      return;
    }
    
    // Check if the new key already exists in this outcome
    if (outcomeRefs[outcomeKey].stats[newKey] !== undefined && newKey !== oldKey) {
      inputElement.setCustomValidity(`Key "${newKey}" already exists`);
      inputElement.reportValidity();
      return;
    }
    
    // Clear validation error
    inputElement.setCustomValidity('');
    
    // Create new objects with the updated key
    const updatedStats = {};
    const updatedValues = {};
    
    // Copy all stats to the new objects with the updated key
    Object.entries(outcomeRefs[outcomeKey].stats).forEach(([key, value]) => {
      if (key === oldKey) {
        updatedStats[newKey] = value;
        updatedValues[newKey] = outcomeRefs[outcomeKey].statValues[key];
      } else {
        updatedStats[key] = value;
        updatedValues[key] = outcomeRefs[outcomeKey].statValues[key];
      }
    });
    
    // Update the references
    outcomeRefs[outcomeKey].stats = updatedStats;
    outcomeRefs[outcomeKey].statValues = updatedValues;
    
    // Update the key in the keys array
    outcomeStatKeys[outcomeKey] = outcomeStatKeys[outcomeKey].map(k => 
      k === oldKey ? newKey : k
    );
  }

  async function submitChapter() {
    successMessage = '';
    errorMessage = '';

    // Reset validations
    formElement.querySelectorAll('input').forEach(input => {
      input.setCustomValidity('');
    });
    
    // Validate and generate real outcome keys from titles
    const processedOutcomes = {};
    const generatedKeys = {};
    
    for (const tempKey of tempOutcomeKeys) {
      const titleInput = outcomeRefs[tempKey].title;
      const titleValue = titleInput.value.trim();
      
      if (!titleValue) {
        titleInput.setCustomValidity('Title is required to generate key');
        titleInput.reportValidity();
        console.log('Title is required to generate key.');
        return;
      }
      
      // Validate stats keys
      if (!validateStatsKeys(tempKey)) {
        console.log('Invalid stats keys for outcome:', tempKey);
        return;
      }

      const generatedKey = generateOutcomeKey(titleValue);
      
      // Check for duplicate outcome keys
      if (generatedKeys[generatedKey]) {
        titleInput.setCustomValidity('This title generates a duplicate outcome key');
        titleInput.reportValidity();
        console.log('This title generates a duplicate outcome key.');
        return;
      } else {
        generatedKeys[generatedKey] = true;
        
        // Build stats object for this outcome
        const stats = {};
        Object.entries(outcomeRefs[tempKey].stats).forEach(([statKey, statRef]) => {
          const valueRef = outcomeRefs[tempKey].statValues[statKey];
          if (statRef && valueRef) {
            stats[statRef.value] = valueRef.value;
          }
        });
        
        // Build outcome object
        processedOutcomes[generatedKey] = {
          goto: outcomeRefs[tempKey].goto ? parseInt(outcomeRefs[tempKey].goto.value) || 0 : 0,
          stats: stats,
          text: outcomeRefs[tempKey].text ? outcomeRefs[tempKey].text.innerHTML : '',
          title: titleValue
        };
      }
    }

    try {
      // Assemble the complete chapter object
      const chapter = {
        character: characterRef.value,
        game: gameSelectRef.value,
        img: imgRef.value,
        outcomes: processedOutcomes,
        question: {
          lang: 'pl',
          text: questionRef.innerHTML
        },
        seq_id: parseInt(seqIdRef.value) || 0,
        suggested_replies: suggestedReplyRefs.filter(ref => ref).map(ref => ref.value),
        system_prompt: systemPromptRef.innerHTML,
        text: {
          lang: 'pl',
          text: textRef.innerHTML
        },
        title: {
          lang: 'pl',
          text: titleRef.value
        }
      };

      // Submit the chapter
      const createdChapter = await createChapter(chapter);
      console.log('Chapter created:', createdChapter);

      location.reload();
    } catch (error) {
      console.error('Error creating chapter:', error);
      if (error.message && error.message.includes('seq_id already exists')) {
        seqIdRef.setCustomValidity('This Sequence ID already exists for this game');
        seqIdRef.reportValidity();
      } else {
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
    }
  }
</script>

<TitleWithBackgroundImageComponent>Add Chapter</TitleWithBackgroundImageComponent>
<form on:submit|preventDefault={submitChapter} bind:this={formElement} novalidate>
  <div class="card">
    <h4>Game Details</h4>
    <div class="input-container">
      <label for="game">Game</label>&nbsp;&nbsp;
      <select id="game" bind:this={gameSelectRef} required>
        <option value="" disabled>Select a game</option>
        {#each games as game}
          <option value={game.id} selected={game.id === selectedGame}>{game.name}</option>
        {/each}
      </select>
    </div>
    <div class="input-container">
      <label for="character">Character</label>
      <input type="text" id="character" bind:this={characterRef} />
    </div>
    <div class="input-container">
      <label for="img">Image URL</label>
      <input type="text" id="img" bind:this={imgRef} />
    </div>
    <div class="input-container">
      <label for="seq_id">Sequence ID</label>&nbsp;&nbsp;
      <input type="number" id="seq_id" bind:this={seqIdRef} required />
    </div>
    <div class="input-container">
      <label for="system_prompt">System Prompt</label>
      <div 
        id="system_prompt" 
        contenteditable="true" 
        bind:this={systemPromptRef}
      ></div>
    </div>
  </div>

  <div class="card">
    <h4>Outcomes</h4>
    {#each tempOutcomeKeys as key (key)}
      <div class="card">
        <div class="input-container">
          <label for={`outcome-title-${key}`}>Title</label>
          <input 
            type="text" 
            id={`outcome-title-${key}`} 
            bind:this={outcomeRefs[key].title}
            required
          />
        </div>
        <div class="input-container">
          <label for={`outcome-goto-${key}`}>Next chapter</label>&nbsp;&nbsp;
          <input 
            type="number" 
            id={`outcome-goto-${key}`} 
            bind:this={outcomeRefs[key].goto}
          />
        </div>
        
        <div class="input-container">
          <label>Stats</label>
          {#each outcomeStatKeys[key] || [] as statKey}
          <div class="two-columns">
            <div class="input-container">
              <label>Stat</label>
              <input 
                type="text" 
                id={`stat-key-${key}-${statKey}`}
                bind:this={outcomeRefs[key].stats[statKey]}
                value={statKey} 
                on:change={(e) => updateStatKey(key, statKey, e.target.value, e.target)}
              />
            </div>
            <div class="input-container">
              <label>Value modifier</label>
              <input 
                type="text"
                bind:this={outcomeRefs[key].statValues[statKey]}
              />
            </div>
            <button type="button" on:click={() => removeStat(key, statKey)} class="chat-circle-btn">-</button>
          </div>
          {/each}
          <button type="button" on:click={() => addStat(key)}>Add Stat</button>
        </div>
        
        <div class="input-container">
          <label for={`outcome-text-${key}`}>Text</label>
          <div 
            id={`outcome-text-${key}`} 
            contenteditable="true"
            bind:this={outcomeRefs[key].text}
          ></div>
        </div>
        
        <div class="input-container">
          <button type="button" on:click={() => removeOutcome(key)}>Remove Outcome</button>
        </div>
      </div>
    {/each}
    <div class="input-container">
      <button type="button" on:click={addOutcome}>Add Outcome</button>
    </div>
  </div>

  <div class="card">
    <h4>Suggested Replies</h4>
    {#each suggestedReplyIndexes as uniqueIndex, index (uniqueIndex)}
      <div class="input-container">
        <input type="text" bind:this={suggestedReplyRefs[index]} />
        <button type="button" on:click={() => removeSuggestedReply(index)} class="chat-circle-btn">-</button>
      </div>
    {/each}
    <div class="input-container">
      <button type="button" on:click={addSuggestedReply}>Add Reply</button>
    </div>
  </div>

  <div class="card">
    <h4>Text and Title</h4>
    <div class="input-container">
      <label for="title">Title</label>
      <input type="text" id="title" bind:this={titleRef} />
    </div>
    <div class="input-container">
      <label for="text">Text</label>
      <div 
        id="text" 
        contenteditable="true"
        bind:this={textRef}
      ></div>
    </div>
    <div class="input-container">
      <label for="question">Question</label>
      <div 
        id="question" 
        contenteditable="true"
        bind:this={questionRef}
      ></div>
    </div>
  </div>

  {#if successMessage}
    <div class="success-message card">{successMessage}</div>
  {/if}

  {#if errorMessage}
    <div class="error-message card">{errorMessage}</div>
  {/if}

  <div class="input-container">
    <button type="submit">Submit Chapter</button>
  </div>
</form>

<style>
  .error-message {
    color: red;
    font-size: 0.8em;
    margin-top: 5px;
  }
  
  .hint {
    font-size: 0.8em;
    color: #666;
    font-style: italic;
  }
  
  .input-error {
    border: 1px solid red !important;
    background-color: rgba(255, 0, 0, 0.05) !important;
  }
</style>
