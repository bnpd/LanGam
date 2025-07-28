<script lang="ts" defer>
	import Popup from "./Popup.svelte";
    let umami: any; // Umami is initialized in the +layout.svelte from script tag
    
    let isOpen = false
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

<Popup bind:isOpen={isOpen} closeButtonText="Let's go!" on:closed={() => {umami?.track('Help closed')}}>
    <div style="overflow-y: auto;">
        <h1 style="margin-bottom: 2vh;">You decide how the story unfolds</h1>
        <p>    
            ☝ Tap on any word for a quick definition.

            Press &nbsp;▶&nbsp; to navigate to the next chapter.
            <!--Press &nbsp;📖&nbsp; to for optional grammar help.
            -->
            There, you'll meet unique characters to talk with, and your interactions will create your very own story.
            <!--Language learning is woven into every chapter and you can explore vocabulary and grammar at your own pace. -->
            
        </p>
        <br>
    </div>
</Popup>
{#if !isOpen}
    <button on:click={()=>{isOpen = true}} data-umami-event="Help opened">
        ❔
    </button>
{/if}
