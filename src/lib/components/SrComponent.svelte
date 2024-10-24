<script lang="ts">
	import { nativeLang, targetLang } from "$lib/stores";
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
        showSolution = false
        dueWords = dueWords
    }
</script>

{#if dueWords?.length}
    {@const card = dueWords[0]}
    <div class="card" style="line-height: 2em;">
        {(card.reversed ? $targetLang.shortcode : $nativeLang).toUpperCase()}: {card.reversed ? card.word : card.meaning} {#if showSolution && card.reversed && card.genus}&nbsp;&nbsp;<em>{card.genus}</em>{/if} <br>
        <hr>
        {(card.reversed ? $nativeLang : $targetLang.shortcode).toUpperCase()}: 
        {#if showSolution}
            {card.reversed ? card.meaning : card.word} {#if !card.reversed && card.genus}&nbsp;&nbsp;<em>{card.genus}</em>{/if} <br>
            {#if card.notes}
                {card.notes} <br>
            {/if}
            {#if card.pronunciation}
                Pronounciation: {card.pronunciation} <br>
            {/if}
            <button on:click={()=>onSubmitRating(card, Rating.Again)}>{'Again'}</button>
            <button on:click={()=>onSubmitRating(card, Rating.Hard)}>{'Hard'}</button>
            <button on:click={()=>onSubmitRating(card, Rating.Good)}>{'Good'}</button>
            <button on:click={()=>onSubmitRating(card, Rating.Easy)}>{'Easy'}</button>
        {:else}
            <br>
            <button on:click={()=>showSolution=true}>Solution</button>
        {/if}
    </div>
{/if}
