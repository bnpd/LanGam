<script lang="ts" defer>
	import Popup from "./Popup.svelte";

	export let title: String | undefined = 'Congratulations!';
	export let message: String | undefined;
	export let footnote: String | undefined = undefined;
	export let onClose: Function;
	

	function closeSelf() {
		title = undefined;
		message = undefined; 
		footnote = undefined;
		onClose();
	}
</script>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->

<Popup on:closed={() => closeSelf()} isOpen={message != undefined && title != undefined}>
	<h1>{title}</h1>
	<p style="white-space: pre-line">{message}</p>
	{#if footnote}
		<div><small>{footnote}</small></div>
	{/if}
</Popup>
