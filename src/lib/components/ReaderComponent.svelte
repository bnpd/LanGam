<script lang="ts">
  import { currentTask, failedWords, currentlyScrolledParagraphIndex } from '../stores';
	import { afterUpdate, tick } from "svelte";
	import TaskComponent from "./TaskComponent.svelte";


  let solutionField: HTMLDivElement
  export function getSolutionField() {return solutionField}
  let divTask: HTMLDivElement
  export function getDivTask() {return divTask}
  let solutionParagraphs: Array<{htmlTag: string, string: string}> = []
  let taskComponent: TaskComponent

  export let phase: string
  export let trySpeak: Function
  export let solutionText: string
  export let taskVisible: boolean
  export let srWords: Set<String> | undefined

  $: if($currentTask) onTaskReset()
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
    let visibleParagraphs = taskComponent.getTaskParagraphs().slice(top, bottom+1).map(p => p.words.map(token => token.word).join('')).join('\n')
    return visibleParagraphs
  }

  function onScroll(e: Event) {    
    // Scroll the solutionField to the same paragraph index as divTask
    const newScrollIndex = currentScrolledParagraphIndex()
    if (newScrollIndex != $currentlyScrolledParagraphIndex) {
      $currentlyScrolledParagraphIndex = newScrollIndex
      scrollToParagraph(solutionField, newScrollIndex)
    }

    // adjust height of the background image (reaches 100hv when fully scrolled down)
    document.body?.style?.setProperty('--header-before-height', `${divTask?.scrollTop / divTask?.scrollHeight * 100 + 10}dvh`);
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

  

  async function setSolution(solution: string) {
    solutionParagraphs = []
    await tick();
    solution = solution.replace('\r', '').replace('\n\n', '\n')
    let row = 1
    solution.split('\n').map(paragraph => {
      if (!paragraph.trim()) return // if it was only some kind of whitespace, don't bother
      const headingLevel = getHeadingLevelForSolution(paragraph)
      solutionParagraphs.push({htmlTag: headingLevel ? 'h'+headingLevel : 'p', string: paragraph.slice(headingLevel)})
    });
    solutionParagraphs = solutionParagraphs
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

  async function onTaskReset() {
    if (divTask) divTask.scrollTop = 0
    if (solutionField) solutionField.scrollTop = 0
    phase = "prompting"
  }

</script>

<div class="card" id="contentbox">
  <div id="divTask" class:hidden={!taskVisible} bind:this={divTask} on:scroll={onScroll}>
    <TaskComponent task={$currentTask} srWords={srWords} trySpeak={trySpeak} bind:this={taskComponent} />
    <div>
      <slot name="afterTask" />
    </div>
  </div>
  <hr>
  <div id="solutionField" bind:this={solutionField} class:hidden={phase !== "solutionShown"}>
    {#each solutionParagraphs as para, row}
    <svelte:element this={para.htmlTag} style:gridRow={row}>
      {para.string}
    </svelte:element>
    {/each}  
    <div>
      <slot name="afterSolution" />
    </div>
  </div>
</div>