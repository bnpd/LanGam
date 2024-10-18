<script lang="ts">
	import { targetLang } from "$lib/stores";

    export let word;
    let iframe;
</script>

<style>  
  
</style>

<iframe bind:this={iframe} title="{word} - Wiktionary" src="https://en.m.wiktionary.org/wiki/Special:Search/{word}#{$targetLang.nameEN}"/>