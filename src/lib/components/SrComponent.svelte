<script lang="ts">
	import { nativeLang, srShowGenus, srShowIPA, targetLang } from "$lib/stores";
	import { Rating, type Grade } from "ts-fsrs";
	import { deleteSrCard, getDue, updateSrCard } from "./backend";
	import type { VocabCard } from "$lib/fsrs";
	import { onMount } from "svelte";
	import BadgeComponent from "./BadgeComponent.svelte";
	import Toast from "./Toast.svelte";
	import Popup from "./Popup.svelte";
	import FormComponent from "./FormComponent.svelte";

    let showSolution = false
    let dueWords: VocabCard[]
    let confirmDeleteToast: string | undefined
    let showEditForm = false
    let successMessage: string | undefined
    let formError: string | undefined

    function getSrFormFields() {return [
        {name: 'Word', id: 'word', value: dueWords[0]?.word},
        {name: 'Meaning', id: 'meaning', value: dueWords[0]?.meaning},
        {name: 'Notes', id: 'notes', value: dueWords[0]?.notes},
        {name: 'Pronunciation', id: 'pronunciation', value: dueWords[0]?.pronunciation}
        // {name: 'Sentence' extracted from text}
    ].concat(dueWords[0]?.genus?.length ? [
        {name: 'Gender', id: 'genus', value: dueWords[0]?.genus}
    ] : [])}

    onMount(async ()=>{
        dueWords = await getDue($targetLang?.id)
    })

    async function onSubmitRating(card: VocabCard, rating: Grade) {
        console.log(card);
        console.log(card.review);
        
        
        card.review(rating)
        const updatedPromise = updateSrCard(card)
        dueWords.shift()
        showSolution = false
        dueWords = dueWords
        if (!dueWords?.length) { // we are done, check once again whether we really are
            await updatedPromise
            dueWords = await getDue($targetLang?.id)
        }
    }

    function onSubmitEditForm(formdata: { [x: string]: string | undefined; }) {
        for (const key in formdata) {
            dueWords[0][key] = formdata[key];
        }
        updateSrCard(dueWords[0]).then(() => {successMessage = 'Updated.'; showEditForm = false}).catch(() => formError = 'Failed to update, sorry.')
        dueWords = dueWords
    }

    function onDeleteConfirmed(){
        showEditForm = false
        deleteSrCard(dueWords[0]).then(()=>successMessage='Deleted.').catch(()=>formError='Failure.'); 
        dueWords = dueWords.slice(1)
        dueWords = dueWords
    }
</script>

<h3>Spaced Repetition</h3>
{#if dueWords?.length}
    {@const card = dueWords[0]}
    <div class="card" style="line-height: 2em;">
        <BadgeComponent text={(card.reversed ? $targetLang.shortcode : $nativeLang).toUpperCase()}/>&nbsp;{card.reversed ? card.word : card.meaning} {#if showSolution && card.reversed && card.genus && $srShowGenus}&nbsp;&nbsp;<em>{card.genus}</em>{/if} <br>
        <hr>
        <BadgeComponent text={(card.reversed ? $nativeLang : $targetLang.shortcode).toUpperCase()}/>&nbsp;
        <span class:hidden={!showSolution}>
            {card.reversed ? card.meaning : card.word} {#if !card.reversed && card.genus && $srShowGenus}&nbsp;&nbsp;<em>{card.genus}</em>{/if} <br>
            {#if card.notes}
                🗒 {card.notes} <br>
            {/if}
            {#if card.pronunciation && $srShowIPA}
                🗣 {card.pronunciation} <br>
            {/if}
        </span>
        <div style="text-align: center;">
            <button on:click={()=>showEditForm=true}>Edit</button>
            {#if showSolution}
                <button on:click={()=>onSubmitRating(card, Rating.Again)} class='highlighted'>{'Again'}</button>
                <button on:click={()=>onSubmitRating(card, Rating.Hard)} class='highlighted'>{'Hard'}</button>
                <button on:click={()=>onSubmitRating(card, Rating.Good)} class='highlighted'>{'Good'}</button>
                <button on:click={()=>onSubmitRating(card, Rating.Easy)} class='highlighted'>{'Easy'}</button>
            {:else}
                <button on:click={()=>showSolution=true} class='highlighted'>Solution</button>
            {/if}
        </div>
    </div>
    <Popup bind:isOpen={showEditForm} closeButtonText="Discard changes">
        <div style="overflow: auto;">
            <FormComponent fields={getSrFormFields()} submitOptions={[
                {text:'Delete', handler: ()=>{confirmDeleteToast='Are you sure?'}, disableOnSubmit: true},
                {text:'Save', handler: onSubmitEditForm, disableOnSubmit: true, cssClass: 'highlighted'}
            ]}/>
        </div>
    </Popup>

    <Toast bind:message={confirmDeleteToast} textReject="Delete" onReject={onDeleteConfirmed}/>
    <Toast bind:message={successMessage}/>
    <Toast bind:message={formError}/>
{:else if dueWords}
    <div class="card"><em>All cought up ✨</em></div>
{:else}
    <div class="loading"></div>
{/if}
