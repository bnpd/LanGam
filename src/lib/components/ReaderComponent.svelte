<script lang="ts">
	import type DocumentC from "$lib/DocumentC";
	import Token from "$lib/Token";
	import TokenComponent from "./TokenComponent.svelte";
  import { currentTask, failedWords, currentlyScrolledParagraphIndex } from '../stores';
	import { afterUpdate } from "svelte";

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
  export let srWords: Set<String> | undefined


  $: if($currentTask && divTask && solutionField && $currentTask.docId != docIdOfCurrentTask) setTask($currentTask)
  $: if(solutionText) setSolution(solutionText)

  afterUpdate(() => {
    if (divTask?.scrollTop == 0) {
      // on first time we added all p elements, restore scroll position
      scrollToParagraph(divTask, Math.max($currentlyScrolledParagraphIndex - 1, 0))
      scrollToParagraph(solutionField, $currentlyScrolledParagraphIndex - 1)
    }
  })

  export function getVisibleParagraphs() {
    const top = currentScrolledParagraphIndex('top')
    const bottom = currentScrolledParagraphIndex('bottom')
    console.log(top);
    console.log(bottom);
    let visibleParagraphs = taskParagraphs.slice(top, bottom+1).map(p => p.words.map(token => token.word).join('')).join('\n')
    console.log(visibleParagraphs);
    return visibleParagraphs
  }

  function onScroll(e: Event) {
    // unfocus any other element (e.g. chat response window)
    (document?.activeElement as HTMLElement)?.blur();
    
    // Scroll the solutionField to the same paragraph index as divTask
    const newScrollIndex = currentScrolledParagraphIndex()
    if (newScrollIndex != $currentlyScrolledParagraphIndex) {
      $currentlyScrolledParagraphIndex = newScrollIndex
      scrollToParagraph(solutionField, newScrollIndex)
    }

    // adjust height of the background image (reaches 100hv when fully scrolled down)
    console.log((divTask?.scrollTop + divTask?.offsetHeight) / divTask?.scrollHeight);
    
    
    document.body?.style?.setProperty('--header-before-height', `${divTask?.scrollTop / divTask?.scrollHeight * 100 + 10}vh`);
  }

  // Find index of the paragraph at the top/mid/bottom (depending on ref param) position of divTask 
  // if ref='mid' && min/max scrolled, then first/last index is returned)
  function currentScrolledParagraphIndex(ref: string = 'mid') {
    let paragraphs = divTask.children
    if (ref == 'mid' && divTask?.scrollTop + (paragraphs[0] as HTMLElement)?.offsetTop == divTask?.scrollHeight) {
      return paragraphs.length -1
    }
    if (ref == 'mid' && divTask?.scrollTop == 0) return 0

    for (var i = 0; i < paragraphs.length; i++) {
      if (
        divTask?.scrollTop + (ref=='top' ? 0 : ref=='mid' ? 0.5 : 1) * divTask?.offsetHeight 
        < (paragraphs[i] as HTMLElement)?.offsetTop - (paragraphs[0] as HTMLElement)?.offsetTop
      ) {
        return i-1;
      }
    }
    return paragraphs.length-1;
  }

  function scrollToParagraph(el: HTMLElement, paragraphIndex: number) {    
    el.scrollTop = (el.children[paragraphIndex] as HTMLElement)?.offsetTop - (el.children[0] as HTMLElement)?.offsetTop;    
  }

  /**
   * Set a document as the currently shown task
   * @param {DocumentC} doc Document containing the task
   */
  function setTask(doc: DocumentC) {        
    console.log(doc?.title?.text);
    
    docIdOfCurrentTask = $currentTask.docId // keep track of currentTask so that we don't do all the work of setTask twice

    divTask.scrollTop = 0
    solutionField.scrollTop = 0

    divTask.textContent = '' // delete previous task
    phase = "prompting"

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
  <div id="divTask" class:hidden={!taskVisible} bind:this={divTask} on:scroll={onScroll}>
    {#each taskParagraphs as taskParagraph}
      <svelte:element this={taskParagraph.htmlTag}>
        {#each taskParagraph.words as token}
          <TokenComponent 
            word={token?.word} 
            isFailed={$failedWords?.has(token?.word)}
            isSrWord={srWords?.has(token?.lemma_)}
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