<script lang="ts" defer>
	import Popup from "./Popup.svelte";
	// let onClose: Function;
	
</script>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->

<style>
    p {
        white-space: pre-line; 
        text-align: justify;
        line-height: 150%;
        font-size: large;
    }
</style>

<Popup isOpen={true} closeButtonText="Let's go!">
	<h1>Ready for an adventure?</h1>
	<p>
        Make the jump to advanced Polish by playing this text based game where you decide how the story unfolds.

        As you progress through each part of the story, you'll meet unique characters to talk with, and your interactions will create your very own story.

        Language learning is woven into every chapter and you can explore vocabulary and grammar at your own pace. Tap on any word for a quick definition and save it for spaced repetition practice.
    </p>
    <br>
</Popup>
