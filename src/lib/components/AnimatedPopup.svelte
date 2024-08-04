<script lang="ts">
	import BadgeComponent from "./BadgeComponent.svelte";

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

{#if message}
	<div class="popup-container" on:click|self={() => closeSelf(false)}>
		<div class="popup">
			<h1>Congratulations!</h1>
			<p style="white-space: pre-line">{message}</p>
			{#if chatPrompt}
				<br>
				<p>Continue chatting about the topic:</p>
				<p><em><strong><BadgeComponent text='AI' tooltip='Chat with AI to advance your speaking skills'/></strong>&nbsp;{chatPrompt}</em></p>
				<button class="close-to-chat-button" on:click={() => closeSelf(true)}>Chat</button>
			{/if}
			<button class="close-button" on:click={() => closeSelf(false)}>Close</button>
		</div>
	</div>
{/if}

<style>
	.popup-container {
		display: flex;
		justify-content: center;
		align-items: center;
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.6);
		animation: fadeIn 0.5s;
	}

	.popup {
		background-color: white;
		padding: 2rem;
		border-radius: 10px;
		text-align: center;
		animation: slideIn 0.5s;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideIn {
		from {
			transform: translateY(-50%);
		}
		to {
			transform: translateY(0);
		}
	}
</style>
