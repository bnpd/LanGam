<script lang="ts" defer>
	import BadgeComponent from "./BadgeComponent.svelte";
	import Popup from "./Popup.svelte";

	export let message: String | undefined;
	export let onClose: Function;
	

	function closeSelf() {
		message = undefined; 
		onClose();
	}
</script>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->

{#if message != undefined}
	<Popup on:closed={() => closeSelf()}>
		<h1>Congratulations!</h1>
		<p style="white-space: pre-line">{message}</p>
	</Popup>
{/if}