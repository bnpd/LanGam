<script lang="ts" defer>
	import { currentTask, isSoundOn, targetLang, ttsSpeed } from "$lib/stores";
	import { onMount } from "svelte";

    var voice: SpeechSynthesisVoice

    onMount(() => {
        // run setVoice when voices are loaded (onvoiceschanged)
        if (
            typeof speechSynthesis !== "undefined" &&
            speechSynthesis.onvoiceschanged !== undefined
        ) {
            speechSynthesis.onvoiceschanged = setVoice
        }
        if (speechSynthesis.getVoices() && speechSynthesis.getVoices().length) {
            setVoice()  // if we were too slow and the voice has already been set before speechSynthesis.onvoiceschanged = setVoice, just call setVoice immediately
        }
    })
    
    function onSoundClick() {
		$isSoundOn = ! $isSoundOn
		if ($isSoundOn) {
            trySpeakCurrentTask()
		} else {
			speechSynthesis.cancel()
		}
    }

    export function trySpeakCurrentTask() {
        trySpeak(($currentTask.title.text + '\n' + $currentTask.text.text).replace(/\xa0/g, '').replaceAll('#', '')) // remove nbsp just in case its a problem, and remove hashtags
    }

    export function trySpeak(str: string) {
        if ($isSoundOn && voice != null) {
            let utterance = new SpeechSynthesisUtterance(str)
            utterance.voice = voice
            utterance.lang = voice.lang
            utterance.rate = $ttsSpeed
            speechSynthesis.speak(utterance)
        }
    }

    function setVoice() {
        const separator = speechSynthesis.getVoices()[0].lang.includes('-') ? '-' : '_'
        let voices_in_lang = speechSynthesis.getVoices().filter(voice=>{return voice.lang.split(separator)[0].toUpperCase()===$targetLang.toUpperCase()})
        if (voices_in_lang.length!==0) {
            voice = voices_in_lang[0]
        }
    }
</script>

<button id="btnSound" on:click={onSoundClick}>{$isSoundOn ? '🔊' : '🔈'}</button>