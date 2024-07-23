<script lang="ts">
	 export let message: String | undefined;
     export let onClose: Function;

	 function closeSelf() {
		message = undefined; 
		onClose();
	 }
</script>

{#if message}
	<div class="popup-container" on:click|self={closeSelf}>
		<div class="popup">
			<h1>Congratulations!</h1>
			<p style="white-space: pre-line">{message}</p>
			<button class="close-button" on:click={closeSelf}>Close</button>
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

	.close-button {
		background-color: #007bff;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		margin-top: 1rem;
		border-radius: 5px;
		cursor: pointer;
		transition: background-color 0.3s;
	}

	.close-button:hover {
		background-color: #0056b3;
	}
</style>
