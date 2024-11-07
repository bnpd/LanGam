<script lang="ts" defer>
	import type DocumentC from "$lib/DocumentC";
	import { failedWords, currentTaskNParagraphs } from "$lib/stores";
	import type Token from "$lib/Token";
	import TokenComponent from "./TokenComponent.svelte";
	import TtsComponent from "./TtsComponent.svelte";


    export let task: DocumentC
    export let srWords: Set<String> | undefined
    let trySpeak: ((str: string) => void) | undefined
    let taskParagraphs: Array<{htmlTag: string, words: Array<any>}> = []
    $: if(task) taskParagraphs = makeTask(task)

    function makeTask(doc: DocumentC) {
        let resParas = []
        let space = {word: ' ', lemma_: '', pos: -1}
        let isTitle = true
        for (const translatableText of [doc.title, doc.text]) {
            if (translatableText) {
                let paragraph = []	
                let char_index = 0	
                for (const start_char in translatableText.tokens) {                       
                    while (char_index < (start_char as unknown as number)) { // insert whitespace and newlines
                    if (translatableText.text[char_index] == '\n' && paragraph.length > 0) {
                        // next paragraph
                        const headingLevel = getHeadingLevelForTask(paragraph)
                        resParas.push({htmlTag: isTitle && !headingLevel ? 'h3' : headingLevel ? 'h'+headingLevel : 'p', words: paragraph.slice(headingLevel)})
                        paragraph = []
                    } else if (paragraph.length > 0) { // length>0 cause we do not want to push leading spaces to paragraphs
                        paragraph.push(space)
                    }
                    char_index++
                    }
                    // now our char indexes are synced
    
                    let token_obj = translatableText.tokens[char_index]
                    let token_word = token_obj?.word
    
                    if (!token_word?.trim()) continue // only proceed if it wasn't only some kind of whitespace
                    paragraph.push(token_obj)
                    char_index += token_word.length
                }
                if(paragraph.length > 0) {
                    const headingLevel = getHeadingLevelForTask(paragraph)
                    resParas.push({htmlTag: isTitle && !headingLevel ? 'h3' : headingLevel ? 'h'+headingLevel : 'p', words: paragraph.slice(headingLevel)})
                }
            }
            isTitle = false // done with title
        }
        
        if (task.title) { // if it is an acutal level, not just a chat bubble which doesn't have title, set task length
            $currentTaskNParagraphs = resParas.length
        }        
        return resParas
    }

    function onWordClick(token: Token) {
    if ($failedWords?.has(token?.word)) {
        $failedWords?.delete(token.word)
    } else {
        if (trySpeak != undefined) trySpeak(token?.word)
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

</script>


{#each taskParagraphs as taskParagraph, i (taskParagraph.words)} <!-- The "key" specified in parentheses is important cause svelte will otherwise use the array index and try to only insert new indexes or do nothing if the array length doesn't change -->
<svelte:element this={taskParagraph.htmlTag}>
  {#each taskParagraph.words as token}
    <TokenComponent 
      token={token}
      isSrWord={srWords?.has(token?.lemma_)}
      on:click={() => {onWordClick(token)}} />
  {/each}          
  {#if i==0}
    <TtsComponent text={task}/>
  {/if}
</svelte:element>
{/each}