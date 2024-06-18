<script lang="ts">
	import type DocumentC from "$lib/DocumentC";
	import Token from "$lib/Token";
	import TokenComponent from "./TokenComponent.svelte";
  import { currentTask, failedWords } from '../stores';

  const NON_CLICKABLE_POS_IDS = new Set([-1, 97, 99, 101]) // added -1 for whitespace


  let solutionField: HTMLDivElement
  let divTask: HTMLDivElement
  let taskParagraphs: Array<{htmlTag: string, words: Array<any>}> = []
  let solutionParagraphs: Array<{htmlTag: string, string: string}> = []
  let docIdOfCurrentTask: number

  export let phase: string
  export let trySpeak: Function
  export let solutionText: string
  export let taskVisible: boolean


  $: if($currentTask && divTask && solutionField && $currentTask.docId != docIdOfCurrentTask) setTask($currentTask)
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
    console.log(doc);
     
    docIdOfCurrentTask = $currentTask.docId // keep track of currentTask so that we don't do all the work of setTask twice

    divTask.scrollTop = 0
    solutionField.scrollTop = 0

    divTask.textContent = '' // delete previous task
    phase = "prompting"

    taskParagraphs = []
    let space = {word: ' ', lemma_: '', pos: -1}
    for (const translatableText of [doc.title, doc.text]) {
      let paragraph = []	
      let char_index = 0	
      for (const start_char in translatableText.tokens) {                       
        while (char_index < (start_char as unknown as number)) { // insert whitespace and newlines
          if (translatableText.text[char_index] == '\n' && paragraph.length > 0) {
            // next paragraph
            const headingLevel = getHeadingLevelForTask(paragraph)
            taskParagraphs.push({htmlTag: headingLevel ? 'h'+headingLevel : 'p', words: paragraph.slice(headingLevel)})
            paragraph = []
          } else if (paragraph.length > 0) { // length>0 cause we do not want to push leading spaces to paragraphs
            paragraph.push(space)
          }
          char_index++
        }
        // now our char indexes are synced

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
      const headingLevel = getHeadingLevelForTask(paragraph)
      taskParagraphs.push({htmlTag: headingLevel ? 'h'+headingLevel : 'p', words: paragraph.slice(headingLevel)})
    }
    taskParagraphs = taskParagraphs
    console.log(taskParagraphs);
    
  }

  function setSolution(solution: string) {
    solutionParagraphs = []
    solution = solution.replace('\r', '').replace('\n\n', '\n')
    let row = 1
    solution.split('\n').map(paragraph => {
      if (!paragraph.trim()) return // if it was only some kind of whitespace, don't bother
      const headingLevel = getHeadingLevelForSolution(paragraph)
      solutionParagraphs.push({htmlTag: headingLevel ? 'h'+headingLevel : 'p', string: paragraph.slice(headingLevel)})
    });
    solutionParagraphs = solutionParagraphs
  }

  function onWordClick(token: Token) {
    if ($failedWords?.has(token?.word)) {
      $failedWords?.delete(token.word)
    } else {
      trySpeak(token?.word)
      $failedWords?.add(token.word)
    }
    $failedWords = $failedWords
  }

  /**
   * Calculate heading level from number of leading hashtags #
   * @param paragraphWords Array of Tokens of the paragraph
   */
  function getHeadingLevelForTask(paragraphWords: Array<any>) {
    let level = 0;
    for (let i = 0; i < Math.min(4, paragraphWords.length); i++) {
      if (paragraphWords[i]?.word === '#') {
        level++;
      } else {
        break;
      }
    }
    return level;
  }

  /**
   * Calculate heading level from number of leading hashtags #
   * @param paragraph The paragraph string
   */
  function getHeadingLevelForSolution(paragraph: string) {
    let level = 0;
    for (let i = 0; i < Math.min(4, paragraph.length); i++) {
      if (paragraph[i] === '#') {
        level++;
      } else {
        break;
      }
    }
    return level;
  }

</script>

<div class="boxBig" id="contentbox">
  <div id="divTask" class:hidden={!taskVisible} bind:this={divTask} on:scroll={() => syncScroll(divTask, solutionField)}>
    {#each taskParagraphs as taskParagraph}
      <svelte:element this={taskParagraph.htmlTag}>
        {#each taskParagraph.words as token}
          <TokenComponent 
            word={token?.word} 
            isFailed={$failedWords?.has(token?.word)}
            isClickable={!NON_CLICKABLE_POS_IDS.has(token?.pos)}
            on:click={() => {onWordClick(token)}}></TokenComponent>
        {/each}          
      </svelte:element>
    {/each}
  </div>
  <hr>
  <div id="solutionField" bind:this={solutionField} class:hidden={phase !== "solutionShown"}>
    {#each solutionParagraphs as para, row}
    <svelte:element this={para.htmlTag} style:gridRow={row}>
      {para.string}
    </svelte:element>
    {/each}  
  </div>
</div>