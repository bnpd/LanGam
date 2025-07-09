<script lang="ts" defer>
	import { page } from "$app/stores";
	import DocumentC from "$lib/DocumentC";
	import { currentTaskNParagraphs, player } from "$lib/stores";
	import TokenComponent from "./TokenComponent.svelte";
	import TtsComponent from "./TtsComponent.svelte";


    export let task: DocumentC
    export let srWords: Set<String> | undefined
    let taskParagraphs: Array<{htmlTag: string, words: Array<any>}> | undefined = undefined
    $: placeholderTaskParagraphs = $page.data?.firstLevelParagraphs;
    $: if(task) taskParagraphs = onNewTask(task)

    function onNewTask(doc: DocumentC) {
        let resParas = DocumentC.fromJson(doc).makeTask()

        console.log(resParas);
        
        
        if (task.title) { // if it is an acutal level, not just a chat bubble which doesn't have title, set task length
            $currentTaskNParagraphs = resParas.length
        }        
        return resParas
    }

</script>

{#each taskParagraphs ?? placeholderTaskParagraphs as taskParagraph, i (taskParagraph.words)} <!-- The "key" specified in parentheses is important cause svelte will otherwise use the array index and try to only insert new indexes or do nothing if the array length doesn't change -->
<svelte:element this={taskParagraph.htmlTag}>
  {#if i==0 && task?.title}
    <small>#{($player?.level_history?.order?.length ?? 0) + 1}&nbsp; </small>
  {/if}
  {#each taskParagraph.words as token}
    <TokenComponent 
      token={token}
      isSrWord={srWords?.has(token?.lemma_)} />
  {/each}
  {#if i==0}
    <TtsComponent text={task}/>
  {/if}
</svelte:element>
{/each}