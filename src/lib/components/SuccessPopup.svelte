<script lang="ts">
	import BadgeComponent from "./BadgeComponent.svelte";
	import Popup from "./Popup.svelte";

	export let message: String | undefined;
	export let onClose: Function;
	export let chatPrompt: String | undefined = undefined;
	

	function closeSelf(goToChat: boolean) {
		message = undefined; 
		onClose(goToChat);
	}
</script>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->

{#if message != undefined}
	<Popup on:closed={() => closeSelf(false)}>
		<h1>Congratulations!</h1>
		<p style="white-space: pre-line">{message}</p>
		{#if chatPrompt}
			<br>
			<p>Continue chatting about the topic:</p>
			<p><em><strong><BadgeComponent text='AI' tooltip='Chat with AI to advance your speaking skills'/></strong>&nbsp;{chatPrompt}</em></p>
			<button class="close-to-chat-button" on:click={() => closeSelf(true)}>Chat</button>
		{/if}
	</Popup>
{/if}