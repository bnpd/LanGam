<script lang="ts" defer>
	import { browser } from '$app/environment';
	import { pushState } from '$app/navigation';
	import { page } from '$app/stores';
    import { createEventDispatcher, tick } from 'svelte';

    const dispatch = createEventDispatcher();
	export let closeButtonText = 'Close';
	export let isOpen: boolean = false;
	export let onPopstate = closeSelf;
	export let outsideclose = true

	$: if (isOpen && browser) {
		try {
			pushState('', {popup: true})
		} catch (error) {}
	}

	function closeSelf() {
		isOpen = false
		dispatch('closed')
		if($page?.state?.popup) {
			history.back()
		}
		
	}
</script>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->

{#if isOpen}
	<div class="popup-container" on:click|self={() => {if (outsideclose) closeSelf()}}>
		<div class="popup">
			<slot></slot>
			<button class="close-button" on:click={closeSelf}>{closeButtonText}</button>
		</div>
	</div>
{/if}

<svelte:window on:popstate={()=> {if (isOpen) onPopstate()}}/>

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
		z-index: 100;
	}

	.popup {
		background-color: white;
		padding: var(--padding-card);
		border-radius: 10px;
		text-align: center;
		animation: slideIn 0.5s;
		z-index: 101;
		
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		width: 95vw;
		max-height: 90vh;
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