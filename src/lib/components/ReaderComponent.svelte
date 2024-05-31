<script lang="ts">
  const NON_CLICKABLE_POS_IDS = new Set([97, 99, 101])


  let solutionField
  let divTask

  export let state
  export let phase
  export let trySpeak
  export let solutionText
  export let taskVisible

  $: if(state?.currentTask) setTask(state?.currentTask)
  $: if(solutionText) setSolution(solutionText)

  function syncScroll(source, target) {
    // find all paragraphs contained in the text in source and target
    var sourceParagraphs = source.querySelectorAll('p');
    var targetParagraphs = target.querySelectorAll('p');

    // Find the current paragraph index in the source div
    var currentIndex = findCurrentParagraphIndex(source.scrollTop, sourceParagraphs, source);

    // Scroll the target div to the same paragraph index
    target.scrollTop = targetParagraphs[currentIndex].offsetTop-targetParagraphs[0].offsetTop;
  }

  // Function to find the index of the current paragraph based on scroll position
  function findCurrentParagraphIndex(scrollTop, paragraphs, parentEl) {
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
  export function setTask(doc) {
    divTask.scrollTop = 0
    solutionField.scrollTop = 0

    divTask.textContent = '' // delete previous task
    divTask.style.visibility="visible"
    phase = "prompting"
    for (const translatableText of [doc.title, doc.text]) {
      let p = document.createElement('p')		
      let char_index = 0	
      for (const start_char in translatableText.tokens) {


        // TODO: use TokenComponent //


        let span = document.createElement("span")                                
        while (char_index < start_char) { // insert whitespace and newlines
          if (translatableText.text[char_index] == '\n' && p.childElementCount > 0) {
            // next paragraph
            divTask.appendChild(p)
            p = document.createElement('p')
          } else {
            p.append(' ')
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
        span.textContent = token_word
        //span.style.marginRight="0.5em"
        p.appendChild(span)
        char_index += token_word.length

        if (!NON_CLICKABLE_POS_IDS.has(token_obj.pos)) {
          span.className = 'pointer span-'+token_word
          span.addEventListener("click", () => {
            if (state.failedWords.has(token_word)) {
              state.failedWords.delete(token_word)
              Array.from(document.getElementsByClassName('span-'+token_word)).forEach(each => {
                (each as HTMLSpanElement).style.color = ""
                Array.from(document.getElementsByClassName('a-'+token_word)).forEach(eachA => { // remove corresponding dictionary links for all occurrences of the word
                  eachA.parentElement.removeChild(eachA)
                })
              })
            } else {
              if (state.sound) {
                trySpeak(token_word)
              }
              state.failedWords.add(token_word)
              Array.from(document.getElementsByClassName('span-'+token_word)).forEach(each => {
                (each as HTMLSpanElement).style.color = "red"
                let aDict = document.createElement('a')
                aDict.innerHTML = '📕'
                aDict.className = 'a-'+token_word
                aDict.addEventListener("click", () => {
                  window.open('langki://word/?w='+token_word)
                  //window.open('https://translate.google.com/?sl='+state.target_lang+'&tl='+state.native_lang+'&text='+token,'popup','width=600,height=800')
                })
                each.parentElement.insertBefore(aDict, each)
              })
            }
          })
        }
      }
      divTask.appendChild(p)
    }
  }

  function setSolution(solution) {
    solution = solution.replace('\r', '').replace('\n\n', '\n')
    let row = 1
    solution.split('\n').map(paragraph => {
      if (!paragraph.trim()) return // if it was only some kind of whitespace, don't bother
      const p = document.createElement('p')
      p.style.gridRow = row
      p.innerText = paragraph
      solutionField.appendChild(p)
      row++
    });
  }
</script>

<!-- Content Box -->
<div class="boxBig" id="contentbox">
    <div id="divTask" class:hidden={!taskVisible} bind:this={divTask} on:scroll={() => syncScroll(divTask, solutionField)}></div>
    <hr>
    <div id="solutionField" bind:this={solutionField} class:hidden={phase !== "solutionShown"}>{solutionText}</div>
</div>