<script lang="ts">
	import { targetLang } from "$lib/stores";
	import { Rating, type Grade } from "ts-fsrs";
	import { getDue, updateCard } from "./backend";
	import type { VocabCard } from "$lib/fsrs";
	import { onMount } from "svelte";

    let showSolution = false
    let dueWords: VocabCard[]
    onMount(async ()=>{
        dueWords = await getDue($targetLang?.id)
    })

    async function onSubmitRating(card: VocabCard, rating: Grade) {
        console.log('reivew '+rating);
        
        card.review(rating)
        updateCard(card)
        dueWords.shift()
        dueWords = dueWords
    }
</script>

{#if dueWords?.length}
    {@const card = dueWords[0]}
    <div class="card">
        {card.reversed ? card.word : card.meaning} <br>
        {#if showSolution}
            <hr>
            {card.reversed ? card.meaning : card.word} <br>
            {card.notes} <br>
            <button on:click={()=>onSubmitRating(card, Rating.Again)}>{'Again'}</button>
            <button on:click={()=>onSubmitRating(card, Rating.Hard)}>{'Hard'}</button>
            <button on:click={()=>onSubmitRating(card, Rating.Good)}>{'Good'}</button>
            <button on:click={()=>onSubmitRating(card, Rating.Easy)}>{'Easy'}</button>
        {:else}
            <button on:click={()=>showSolution=true}>Solution</button>
        {/if}
    </div>
{/if}
