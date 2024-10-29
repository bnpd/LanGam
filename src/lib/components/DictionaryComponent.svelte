<script lang="ts">
	import { targetLang, dictionaryWord, freqList } from "$lib/stores";
	import { onMount } from "svelte";
	import Popup from "./Popup.svelte";
	import BadgeComponent from "./BadgeComponent.svelte";
	import FormComponent from "./FormComponent.svelte";
	import { addSrWord } from "./backend";
	import WiktionaryFrame from "./WiktionaryFrame.svelte";
	import Toast from "./Toast.svelte";

    function getSrFormFields(whichExtraction: number) {return [
        {name: 'Word', id: 'word', value: $dictionaryWord},
        {name: 'Meaning', id: 'meaning', value: extractedCards?.[whichExtraction]?.meaning?.slice(0, 50) + (extractedCards?.[whichExtraction]?.meaning?.length > 50 && '...')},
        {name: 'Notes', id: 'notes'},
        {name: 'Pronunciation', id: 'pronunciation', value: extractedCards?.[whichExtraction]?.pronunciation, hidden: true}
        // {name: 'Sentence' extracted from text}
    ].concat(extractedCards?.[whichExtraction]?.genus?.length ? [
        {name: 'Gender', id: 'genus', value: extractedCards?.[whichExtraction]?.genus, hidden: true}
    ] : [])}

    let extractedCards: any[] | undefined
    let currentShownExtraction: number = 0
    let formVisible: boolean = false
    let successMessage: string | undefined = undefined
    let formError: string | undefined = undefined
    let lemma: string | undefined
    let freq: string
    let tooltip: string
    let badgeBgColor: string
    let wiktionaryFrame: WiktionaryFrame
    let toastDicardFormInput: string
    $: if ($dictionaryWord) onWordChanged()
    function onWordChanged(){ // this might cause problems 
        lemma = $freqList?.[$dictionaryWord.toLowerCase()]?.lemma
        extractedCards = undefined
        currentShownExtraction = 0
        formVisible = false
        successMessage = undefined
        formError = undefined
        const freqIndex = $freqList?.[$dictionaryWord.toLowerCase()]?.freq
        freq = freqIndex < 2000 ? 'vital' : 
                freqIndex < 5000 ? 'basic' :
                freqIndex < 10000 ? 'common' :
                freqIndex < 15000 ? 'rare' :
                freqIndex < 50000 ? 'niche' :
                undefined
        tooltip = freqIndex < 2000 ? 'One of the most important words (top 2000).' : 
                freqIndex < 5000 ? 'One of the most common words (top 5000).' :
                freqIndex < 10000 ? 'A fairly common word (top 10000).' :
                freqIndex < 15000 ? 'A rare word (top 15000).' :
                freqIndex < 50000 ? 'A niche word (top 50000).' :
                undefined
        badgeBgColor = freqIndex < 2000 ? 'purple' : 
                freqIndex < 5000 ? 'lightblue' :
                freqIndex < 10000 ? 'yellowgreen' :
                freqIndex < 15000 ? 'coral' :
                freqIndex < 50000 ? 'pink' :
                undefined
    }

    function onClose() {
        $dictionaryWord = undefined
    }

    onMount(async () => {
        if (!$freqList) {
            const response = await fetch('/freqLists/PL.json');
            $freqList = await response.json();
        }
    })

    function addToSpacedRepetition(formdata: { [x: string]: string | undefined; }) {
        successMessage = undefined
        formError = undefined
        addSrWord($targetLang.id, formdata, false)
        .then(()=>{
            successMessage = 'Saved!'
        })
        .catch(_validationError => {
            formError = 'Word<-Meaning combination already exists'
        });
    }

    function addToSpacedRepetitionReversed(formdata: { [x: string]: string | undefined; }) {
        successMessage = undefined
        formError = undefined
        addSrWord($targetLang.id, formdata, true)
        .then(()=>{
            successMessage = 'Saved!'
        })
        .catch(_validationError => {
            formError = 'Word->Meaning combination already exists'
        });
    }

    function onPopstate() {
        if (!wiktionaryFrame.goBack()) {
            if (formVisible) {
                toastDicardFormInput = "Discard input?"
            } else {
                $dictionaryWord = undefined
            }
        }
    }
</script>

<Popup on:closed={onClose} isOpen={$dictionaryWord !== undefined} onPopstate={onPopstate} outsideclose={false}>
    <h2>
        {$dictionaryWord}
        {#if lemma && lemma.toLowerCase() != $dictionaryWord?.toLowerCase()}
            &nbsp;
            <a on:click={()=>{$dictionaryWord = lemma}}>->&nbsp;{lemma}</a>
        {/if}
        {#if freq}
            &nbsp;
            <BadgeComponent text={freq} tooltip={tooltip} backgroundColor={badgeBgColor}></BadgeComponent>
        {/if}
    </h2>
    <WiktionaryFrame 
        on:wordNotFound={()=>{if (lemma && lemma?.toLowerCase() != $dictionaryWord?.toLowerCase()) $dictionaryWord = lemma}}
        on:extractedCards={e=>{
            extractedCards = e.detail?.cards
            console.log(extractedCards);
            if (extractedCards?.[0]?.word && extractedCards[0].word !== $dictionaryWord) {
                $dictionaryWord = extractedCards[0].word
                lemma = undefined
            }
        }}
        bind:this={wiktionaryFrame}
    />
    {#if formVisible}
        {#each extractedCards ?? [undefined] as _, i}
            <div hidden={currentShownExtraction!==i}>
                <FormComponent 
                fields={formVisible ? getSrFormFields(i) : undefined} 
                submitOptions={[
                    {text:'Add', handler: addToSpacedRepetition, disableOnSubmit: true}, 
                    {text:'Reversed', handler: addToSpacedRepetitionReversed, disableOnSubmit: true}]}
                />
            </div>
        {/each}
        {#if extractedCards?.length > 1}
            <span>
                Definition 
                <button style:display="inline-block" on:click={()=>currentShownExtraction = (currentShownExtraction+1) % extractedCards.length}>{currentShownExtraction+1}</button> 
                of {extractedCards.length} 
                ({extractedCards?.[currentShownExtraction]?.pos})
            </span>
        {/if}
    {:else}
        <button on:click={() => formVisible = true}>Add to Spaced Repetition</button>
    {/if}
</Popup>
<Toast message={toastDicardFormInput} textReject="Discard" onReject={()=> $dictionaryWord = undefined}/>
<Toast message={successMessage}/>
<Toast message={formError}/>

<style>
    h2 {
        margin-top: -2%;
    }
</style>
