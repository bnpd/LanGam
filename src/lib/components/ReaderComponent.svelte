<script lang="ts">
	import type DocumentC from "$lib/DocumentC";
	import Token from "$lib/Token";
	import TokenComponent from "./TokenComponent.svelte";
  import { currentTask, failedWords } from '../stores';

  const NON_CLICKABLE_POS_IDS = new Set([-1, 97, 99, 101]) // added -1 for whitespace


  let solutionField: HTMLDivElement
  let divTask: HTMLDivElement
  let taskParagraphs: Array<Array<any>> = []
  let solutionParagraphs: Array<string> = []

  export let phase: string
  export let trySpeak: Function
  export let solutionText: string
  export let taskVisible: boolean


  $: if($currentTask && divTask && solutionField) setTask($currentTask)
  $: if(solutionText) setSolution(solutionText)


  function syncScroll(source: HTMLDivElement, target: HTMLDivElement) {
    // find all paragraphs contained in the text in source and target
    var sourceParagraphs = source.querySelectorAll('p');
    var targetParagraphs = target.querySelectorAll('p');

    // Find the current paragraph index in the source div
    var currentIndex = findCurrentParagraphIndex(source.scrollTop, sourceParagraphs, source);

    // Scroll the target div to the same paragraph index
    target.scrollTop = targetParagraphs[currentIndex].offsetTop-targetParagraphs[0].offsetTop;
  }

  // Function to find the index of the current paragraph based on scroll position
  function findCurrentParagraphIndex(scrollTop: number, paragraphs: NodeListOf<HTMLParagraphElement>, parentEl: HTMLDivElement) {
    for (var i = 0; i < paragraphs.length; i++) {
      if (paragraphs[i].offsetTop-paragraphs[0].offsetTop >= scrollTop-0.5*parentEl.offsetHeight) {
        return i;
      }
    }
    return 0; // Default to the first paragraph if not found
  }

  /**
   * Set a document as the currently shown task
   * @param {DocumentC} doc Document cnotaining the task
   */
  function setTask(doc: DocumentC) {    
    divTask.scrollTop = 0
    solutionField.scrollTop = 0

    divTask.textContent = '' // delete previous task
    phase = "prompting"

    let space = new Token(' ', undefined, -1)
    for (const translatableText of [doc.title, doc.text]) {
      let paragraph = []	
      let char_index = 0	
      for (const start_char in translatableText.tokens) {                       
        while (char_index < (start_char as unknown as number)) { // insert whitespace and newlines
          if (translatableText.text[char_index] == '\n' && paragraph.length > 0) {
            // next paragraph
            taskParagraphs.push(paragraph)
            paragraph = []
          } else {
            paragraph.push(space)
          }
          char_index++
        }
        // now we are where we should be, so can insert new span with token

        let token_obj = translatableText.tokens[char_index]
        let token_word = token_obj?.word
        if (!token_word) {
          console.log(char_index);
          console.log(translatableText.tokens);
        }

        if (!token_word.trim()) continue // only proceed if it wasn't only some kind of whitespace
        paragraph.push(token_obj)
        char_index += token_word.length
      }
      taskParagraphs.push(paragraph)
    }
    taskParagraphs = taskParagraphs
  }

  function setSolution(solution: string) {
    solutionParagraphs = []
    solution = solution.replace('\r', '').replace('\n\n', '\n')
    let row = 1
    solution.split('\n').map(paragraph => {
      if (!paragraph.trim()) return // if it was only some kind of whitespace, don't bother
      solutionParagraphs.push(paragraph)
    });
    solutionParagraphs = solutionParagraphs
  }

  function onWordClick(token: Token) {
    if ($failedWords?.has(token?.word)) {
      $failedWords?.delete(token.word)
    } else {
      trySpeak(token)
      $failedWords?.add(token.word)
    }
    $failedWords = $failedWords
  }
</script>

<div class="boxBig" id="contentbox">
  <div id="divTask" class:hidden={!taskVisible} bind:this={divTask} on:scroll={() => syncScroll(divTask, solutionField)}>
    {#each taskParagraphs as taskWords}
    <p>
      {#each taskWords as token}
        <TokenComponent 
          word={token?.word} 
          isFailed={$failedWords?.has(token?.word)}
          isClickable={!NON_CLICKABLE_POS_IDS.has(token?.pos)}
          on:click={() => {onWordClick(token)}}></TokenComponent>
      {/each}
    </p>
    {/each}
  </div>
  <hr>
  <div id="solutionField" bind:this={solutionField} class:hidden={phase !== "solutionShown"}>
    {#each solutionParagraphs as para, row}
    <p style:gridRow={row}>
      {para}
    </p>
    {/each}  
  </div>
</div>