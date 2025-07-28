<script lang="ts">
	import { targetLang, dictionaryToken, freqList, username } from "$lib/stores";
	import { onMount, tick } from "svelte";
	import Popup from "./Popup.svelte";
	import BadgeComponent from "./BadgeComponent.svelte";
	import FormComponent from "./FormComponent.svelte";
	import { addSrWord } from "./backend";
	import WiktionaryFrame from "./WiktionaryFrame.svelte";
	import Toast from "./Toast.svelte";
	import TtsComponent from "./TtsComponent.svelte";
	import DocumentC from "$lib/DocumentC";
    let umami: any; // Umami is initialized in the +layout.svelte from script tag

    const ERROR_MSG_NOT_LOGGED_IN = 'To save cards, please create an account.'

    function getSrFormFields(whichExtraction: number) {return [
        {name: 'Word', id: 'word', value: dictionaryCurrentWord},
        {name: 'Meaning', id: 'meaning', value: extractedCards?.[whichExtraction]?.meaning?.slice(0, 50) ?? '' + (extractedCards?.[whichExtraction]?.meaning?.length > 50 ? '...' : '')},
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
    let wordAdded: boolean = false
    let dictionaryCurrentWord: string | undefined
    let inputDictionaryCurrentWord: HTMLInputElement
    let trySpeak: ((str: string) => void) | undefined
    $: if ($dictionaryToken) onTokenChanged()
    $: if (dictionaryCurrentWord) onWordChanged()
    async function onTokenChanged(){ // this might cause problems
        dictionaryCurrentWord = $dictionaryToken!.word
        umami?.track('Dictionary opened')
    }

    function onWordChanged() {
        lemma = dictionaryCurrentWord?.toLowerCase() == $dictionaryToken?.word?.toLowerCase() ? $dictionaryToken!.lemma_ : undefined
        extractedCards = undefined
        currentShownExtraction = 0
        formVisible = false
        successMessage = undefined
        formError = undefined
        const freqIndex = $freqList?.[dictionaryCurrentWord!]?.i
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
        dictionaryCurrentWord = undefined
        $dictionaryToken = undefined
    }

    onMount(async () => {
        if (!$freqList) {
            const response = await fetch(`/freqLists/${$targetLang.id}.json`);
            $freqList = await response.json();
        }
    })

    function addToSpacedRepetition(formdata: { [x: string]: string | undefined; }, isReversed: boolean) {
        successMessage = undefined
        formError = undefined
        addSrWord($targetLang.id, formdata, isReversed)
        .then(res=>{
            if (res) {
                successMessage = 'Saved!'
                wordAdded = true
            } else formError = 'Internal Error'
        })
        .catch(_validationError => {
            formError = isReversed ? 'Word->Meaning combination already exists' : 'Word<-Meaning combination already exists'
        });
    }

    function onPopstate() {
        if (!wiktionaryFrame.goBack()) {
            if (formVisible && !wordAdded) {
                toastDicardFormInput = "Discard input?"
            } else {
                onClose()
            }
        }
    }
</script>

<Popup on:closed={onClose} isOpen={$dictionaryToken !== undefined} onPopstate={onPopstate} outsideclose={false}>
    <div id="dictionary-container">
        <h2>
            <TtsComponent text={DocumentC.partialDocument($dictionaryToken?.word, $targetLang, {}, {})} bind:trySpeak={trySpeak}/>
            <form 
                id="formDictionaryCurrentWord"
                on:click={async e => {
                    if (inputDictionaryCurrentWord.disabled) {
                        inputDictionaryCurrentWord.disabled = false; 
                        await tick(); 
                        inputDictionaryCurrentWord.focus(); 
                        inputDictionaryCurrentWord.select();
                    } else {
                        dictionaryCurrentWord = inputDictionaryCurrentWord.value.trim().toLowerCase(); 
                        inputDictionaryCurrentWord.disabled = true;
                    }
                }}
                on:submit|preventDefault={() => {
                    dictionaryCurrentWord = inputDictionaryCurrentWord.value.trim().toLowerCase(); 
                    inputDictionaryCurrentWord.disabled = true;
                }}
            >
                <input id="inputDictionaryCurrentWord" disabled type="text" size={Math.ceil(dictionaryCurrentWord?.length*0.7)} value={dictionaryCurrentWord} bind:this={inputDictionaryCurrentWord}>
            </form>
            {#if lemma && lemma.toLowerCase() != dictionaryCurrentWord?.toLowerCase()}
                <a on:click={()=>{dictionaryCurrentWord = lemma}}>→&nbsp;{lemma}</a>
            {/if}
            {#if freq}
                &nbsp;
                <BadgeComponent text={freq} tooltip={tooltip} backgroundColor={badgeBgColor}></BadgeComponent>
            {/if}
        </h2>
        <WiktionaryFrame 
            bind:word={dictionaryCurrentWord}
            on:wordNotFound={()=>{if (lemma && lemma?.toLowerCase() != dictionaryCurrentWord?.toLowerCase()) dictionaryCurrentWord = lemma}}
            on:extractedCards={e=>{
                extractedCards = e.detail?.cards
                if (extractedCards?.[0]?.word && extractedCards[0].word !== dictionaryCurrentWord) {
                    dictionaryCurrentWord = extractedCards[0].word
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
                        {text:'Reversed', handler: formdata=>{addToSpacedRepetition(formdata, true)}, disableOnSubmit: true},
                        {text:`Meaning ➛ Word`, handler: formdata=>{addToSpacedRepetition(formdata, false)}, disableOnSubmit: true, cssClass: 'highlighted'}
                    ]} />
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
            <button on:click={() => {if($username) formVisible = true; else formError=ERROR_MSG_NOT_LOGGED_IN}} data-umami-event="Add to SR Button">Add to Spaced Repetition</button>
        {/if}
    </div>
</Popup>
<Toast bind:message={toastDicardFormInput} textReject="Discard" onReject={onClose} onTimeout={()=>{history.go(1)}}/>
<Toast bind:message={successMessage}/>
<Toast bind:message={formError}/>

<style>
    h2 {
        margin-top: 0;
    }

    #dictionary-container {
        overflow: auto; 
        display: flex; 
        flex-direction: column; 
        height: 100dvh;
    }

    #inputDictionaryCurrentWord {
        background: transparent;
        border: none;
        font-size: inherit;
        width: fit-content;
        margin-bottom: 0;
        padding-right: 0;
    }

    #formDictionaryCurrentWord {
        display: inline-flex;
        flex-direction: row;
        align-items: baseline;
        width: fit-content;
    }

    #formDictionaryCurrentWord:has([disabled])::before {
        content: "✎";
        opacity: 0.15;
    }

#formDictionaryCurrentWord:not(:has([disabled]))::before {
    content: "↵";
    opacity: 0.15;
}
</style>
