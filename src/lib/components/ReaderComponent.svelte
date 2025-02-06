<script lang="ts" defer>
  import { currentTask, currentlyScrolledParagraphIndex, loadingTask } from '../stores';
	import { afterUpdate, tick } from "svelte";
	import TaskComponent from './TaskComponent.svelte';

  enum FIELD {TASK, SOLUTION}


  let solutionField: HTMLDivElement
  export function getSolutionField() {return solutionField}
  let divTask: HTMLDivElement
  export function getDivTask() {return divTask}
  let solutionParagraphs: Array<{htmlTag: string, string: string}> = []
  let taskAndChatParagraphs: NodeListOf<Element>
  let solutionAndChatParagraphs: NodeListOf<Element>
  let scrollRestored = false

  let solutionShown: boolean = false
  export let solutionText: string
  export let srWords: Set<String> | undefined

  $: if($currentTask) onTaskReset()
  $: if(solutionText) setSolution(solutionText)
  afterUpdate(async () => {
    await tick();    
    taskAndChatParagraphs = divTask?.querySelectorAll('p, h1, h2, h3, h4, h5, h6, h7')
    solutionAndChatParagraphs = solutionField?.querySelectorAll('p, h1, h2, h3, h4, h5, h6, h7')
    if (!scrollRestored     
      && taskAndChatParagraphs?.length > 0 
      && taskAndChatParagraphs?.length >= $currentlyScrolledParagraphIndex 
      && solutionAndChatParagraphs?.length > 0
      && solutionAndChatParagraphs?.length >= $currentlyScrolledParagraphIndex
    ) {      
      scrollRestored = true
      // on first time we added all paragraphs, restore scroll position      
      scrollToParagraph(FIELD.TASK, Math.max($currentlyScrolledParagraphIndex - 1, 0))
      scrollToParagraph(FIELD.SOLUTION, Math.max($currentlyScrolledParagraphIndex - 1, 0))
    }
  })

  export function getVisibleParagraphs(): string {
    const top = currentScrolledParagraphIndex('top')
    const bottom = currentScrolledParagraphIndex('bottom')
    let visibleParagraphs = Array.from(divTask?.querySelectorAll('p, h1, h2, h3, h4, h5, h6, h7')).slice(top, bottom+1).map(p => p.textContent).join('\n')
    return visibleParagraphs
  }

  function onScroll() {
    // Scroll the solutionField to the same paragraph index as divTask
    const newScrollIndex = currentScrolledParagraphIndex()    
    if (newScrollIndex != $currentlyScrolledParagraphIndex) {
      $currentlyScrolledParagraphIndex = newScrollIndex
      if (solutionShown) {
        scrollToParagraph(FIELD.SOLUTION, newScrollIndex)
      }
    }

    // adjust height of the background image (reaches 100hv when fully scrolled down)
    document.body?.style?.setProperty('--header-before-height', `${divTask?.scrollTop / divTask?.scrollHeight * 100 + 10}dvh`);
  }

  // Find index of the paragraph at the top/mid/bottom (depending on ref param) position of divTask 
  // if ref='mid' && min/max scrolled, then first/last index is returned)
  // TODO: cache the result of this function for a few milliseconds?
  function currentScrolledParagraphIndex(ref: string = 'mid') {    
    const firstParagraphOffsetTop = (taskAndChatParagraphs[0] as HTMLElement).offsetTop;
    const firstParagraphsOffsetParentElement = (taskAndChatParagraphs[0] as HTMLElement).offsetParent;

    // Determine if at the very top or very bottom
    if (ref == 'mid' && divTask.scrollTop + divTask.offsetHeight == divTask.scrollHeight) {
      return taskAndChatParagraphs.length -1
    }
    if (ref == 'mid' && divTask.scrollTop == 0) return 0

      // Calculate the position to compare with paragraph offset
    const scrollOffset = divTask.scrollTop + (ref === 'top' ? 0 : ref === 'mid' ? 0.5 : 1) * divTask.offsetHeight + firstParagraphOffsetTop;
    for (var i = 0; i < taskAndChatParagraphs.length; i++) {
      if (scrollOffset < findOffsetToAncestor(taskAndChatParagraphs[i] as HTMLElement, firstParagraphsOffsetParentElement!)) {
        return i-1;
      }
    }

    // if we got here, it is either because we are fully scrolled, or because onUpdate did not properly run and taskAndChatParagraphs has not been updated
    // update taskAndChatParagraphs and re-try the above loop, otherwise return last paragraph
    const prevNParas = taskAndChatParagraphs.length
    taskAndChatParagraphs = divTask?.querySelectorAll('p, h1, h2, h3, h4, h5, h6, h7')
    if (prevNParas != taskAndChatParagraphs.length) { // if that changed sth, also update solutionAndChatParagraphs
      solutionAndChatParagraphs = solutionField?.querySelectorAll('p, h1, h2, h3, h4, h5, h6, h7')
    }
    for (var i = 0; i < taskAndChatParagraphs.length; i++) {
      if (scrollOffset < findOffsetToAncestor(taskAndChatParagraphs[i] as HTMLElement, firstParagraphsOffsetParentElement!)) {
        return i-1;
      }
    }
    return taskAndChatParagraphs.length-1;
  }

  function findOffsetToAncestor(el: HTMLElement, ancestor: Element) {
    let res = el.offsetTop
    while (el.offsetParent && el.offsetParent != ancestor) {
      el = el.offsetParent as HTMLElement;
      res += el.offsetTop;
    }      
    return res
  }

  function scrollToParagraph(which: FIELD, paragraphIndex: number) {
    let paragraphs, elToScroll
    switch (which) {
      case FIELD.TASK:
        paragraphs = taskAndChatParagraphs
        elToScroll = divTask
        break;
      case FIELD.SOLUTION:
        paragraphs = solutionAndChatParagraphs
        elToScroll = solutionField        
        break;
    }
    if (!paragraphs?.length) {
      console.warn("No paragraphs yet to scroll to");
      return
    }
    elToScroll.scroll({top: findOffsetToAncestor(paragraphs[paragraphIndex] as HTMLElement, (paragraphs[0] as HTMLElement)?.offsetParent) - (paragraphs[0] as HTMLElement)?.offsetTop, behavior: 'smooth'});    
  }


  export function scrollToBottom() {
    divTask.scroll({top: divTask.scrollHeight, behavior: 'smooth'})
  }
  

  async function setSolution(solution: string) {
    const newSolutionParagraphs: { htmlTag: string; string: string; }[] = []
    await tick();
    solution = solution.replace('\r', '').replace('\n\n', '\n')
    solution.split('\n').map(paragraph => {
      if (!paragraph.trim()) return // if it was only some kind of whitespace, don't bother
      const headingLevel = getHeadingLevelForSolution(paragraph)
      newSolutionParagraphs.push({htmlTag: headingLevel ? 'h'+headingLevel : 'p', string: paragraph.slice(headingLevel)})
    });
    solutionParagraphs = newSolutionParagraphs
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
    solutionShown = false
    // solutionField is synced automatically
  }



	async function onShowSolution(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement; }) {
    solutionShown = true
    await tick()
    setTimeout(() => { // without this timeout, UI hasn't finished adding all the solution paragraphs, which are needed for scrolling
      onScroll()
    }, 100);
	}
</script>

<div class="card" id="contentbox">
  {#if !solutionShown && scrollRestored}
    <button on:click={onShowSolution} style="margin-left: 50%; transform: translateX(-50%)" data-umami-event="Show Translation">Show translation</button>
  {:else if solutionParagraphs?.length}
    <div id="solutionField" bind:this={solutionField}>
      {#each solutionParagraphs as para, row}
      <svelte:element this={para.htmlTag} style:gridRow={row}>
        {para.string}
      </svelte:element>
      {/each}  
      <div>
        <slot name="afterSolution" />
      </div>
    </div>
  {:else}
    <div style:height="var(--button-height)"/>
  {/if}
  <hr>
  <div id="divTask" class:loading={$loadingTask} bind:this={divTask} on:scroll={onScroll}>
    <TaskComponent task={$currentTask} srWords={srWords}/>
    <div>
      <slot name="afterTask" />
    </div>
  </div>
</div>