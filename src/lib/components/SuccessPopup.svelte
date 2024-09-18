<script lang="ts" defer>
	import Popup from "./Popup.svelte";

	export let title: String | undefined = 'Congratulations!';
	export let message: String | undefined;
	export let onClose: Function;
	

	function closeSelf() {
		title = undefined;
		message = undefined; 
		onClose();
	}
</script>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->

{#if message && title}
	<Popup on:closed={() => closeSelf()}>
		<h1>{title}</h1>
		<p style="white-space: pre-line">{message}</p>
	</Popup>
{/if}