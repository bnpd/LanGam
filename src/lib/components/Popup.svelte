<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
	export let closeButtonText = 'Close';
</script>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->

<div class="popup-container" on:click|self={()=>{dispatch('closed')}}>
    <div class="popup">
        <slot></slot>
		<button class="close-button" on:click={() => dispatch('closed')}>{closeButtonText}</button>
    </div>
</div>

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