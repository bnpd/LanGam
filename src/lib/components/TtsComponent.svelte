<script lang="ts" defer>
	import type DocumentC from "$lib/DocumentC";
	import { isSoundOn, ttsSpeed } from "$lib/stores";
	import { onMount } from "svelte";
    import { page } from '$app/stores';

    export let text: DocumentC | undefined = undefined
    let voice: SpeechSynthesisVoice
    let currentlySpeaking = false // tbh this is not set back to false when speaking is done
    $: currentIcon = currentlySpeaking ? '🔊' : $isSoundOn ? '🔉' : '🔈'

    onMount(() => {
        // run setVoice when voices are loaded (onvoiceschanged)
        if (speechSynthesis?.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = setVoice
        }
        if (speechSynthesis?.getVoices()?.length) {
            setVoice()  // if we were too slow and the voice has already been set before speechSynthesis.onvoiceschanged = setVoice, just call setVoice immediately
        }
        if (text && voice && speechSynthesis && $isSoundOn){
            trySpeakAssignedText()
        }
    })
    
    function onSoundClick() {
        if (currentlySpeaking && $isSoundOn) {
			speechSynthesis.cancel()
            currentlySpeaking = false
        } else if ($isSoundOn) {
            $isSoundOn = false
        } else {
            $isSoundOn = true
            trySpeakAssignedText()
        }
    }

    export function trySpeakAssignedText() {
        if (!text) {
            console.warn('TTS: No text assigned to speak')
            return
        }
        trySpeak(((text.title ? text.title.text + '\n' : '') + text.text.text).replace(/\xa0/g, '').replaceAll('#', '')) // remove nbsp just in case its a problem, and remove hashtags
    }

    export function trySpeak(str: string) {
        if ($isSoundOn && voice && speechSynthesis) {
            currentlySpeaking = true
            let utterance = new SpeechSynthesisUtterance(str)
            utterance.voice = voice
            utterance.lang = voice.lang
            utterance.rate = $ttsSpeed
            speechSynthesis.speak(utterance)
            utterance.addEventListener('end', ()=>currentlySpeaking=false)
        }
    }

    function setVoice() {
        const allVoices = speechSynthesis.getVoices()
        if (allVoices?.length) {
            const separator = allVoices[0].lang.includes('-') ? '-' : '_'
            let voices_in_lang = allVoices.filter(voice=>{return voice.lang.split(separator)[0].toLowerCase()===$page.data?.targetLang.id})
            if (voices_in_lang.length) {
                voice = voices_in_lang[0]
            }
        }
    }
</script>

<style>
    .tts-button {
        box-shadow: none;
        background: none;
        border: none;
        opacity: 0.8;
        margin-top: 0;
        margin-bottom: 0;
        height: fit-content;
        line-height: 1; /* Prevents extra space from affecting vertical alignment */
        vertical-align: middle;
    }
</style>

{#if text && voice && speechSynthesis}
    <button id="btnSound" on:click={onSoundClick} class="tts-button" data-umami-event="TTS Toggle">{currentIcon}</button>
{/if}