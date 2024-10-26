<script lang="ts">
	import { nativeLang, targetLang } from "$lib/stores";
	import { Rating, type Grade } from "ts-fsrs";
	import { getDue, updateCard } from "./backend";
	import type { VocabCard } from "$lib/fsrs";
	import { onMount } from "svelte";
	import BadgeComponent from "./BadgeComponent.svelte";

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
        if (!dueWords?.length) { // we are done, check once again whether we really are
            dueWords = await getDue($targetLang?.id)
        }
    }
</script>

<h3>Spaced Repetition</h3>
{#if dueWords?.length}
    {@const card = dueWords[0]}
    <div class="card" style="line-height: 2em;">
        <BadgeComponent text={(card.reversed ? $targetLang.shortcode : $nativeLang).toUpperCase()}/>&nbsp;{card.reversed ? card.word : card.meaning} {#if showSolution && card.reversed && card.genus}&nbsp;&nbsp;<em>{card.genus}</em>{/if} <br>
        <hr>
        <BadgeComponent text={(card.reversed ? $nativeLang : $targetLang.shortcode).toUpperCase()}/>&nbsp;
        <span class:hidden={!showSolution}>
            {card.reversed ? card.meaning : card.word} {#if !card.reversed && card.genus}&nbsp;&nbsp;<em>{card.genus}</em>{/if} <br>
            {#if card.notes}
                🗒 {card.notes} <br>
            {/if}
            {#if card.pronunciation}
                🗣 {card.pronunciation} <br>
            {/if}
        </span>
        {#if showSolution}
            <button on:click={()=>onSubmitRating(card, Rating.Again)}>{'Again'}</button>
            <button on:click={()=>onSubmitRating(card, Rating.Hard)}>{'Hard'}</button>
            <button on:click={()=>onSubmitRating(card, Rating.Good)}>{'Good'}</button>
            <button on:click={()=>onSubmitRating(card, Rating.Easy)}>{'Easy'}</button>
        {:else}
            <button on:click={()=>showSolution=true}>Solution</button>
        {/if}
    </div>
{/if}
