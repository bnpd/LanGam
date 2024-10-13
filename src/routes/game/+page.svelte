<script lang="ts" defer>
	import '../global.css';
	import config from '../../config';
	import { username } from '$lib/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import FeedbackComponent from '$lib/components/FeedbackComponent.svelte';
	import GameComponent from '$lib/components/GameComponent.svelte';
	import Install from '$lib/components/Install.svelte';
	import NavbarComponent from '$lib/components/NavbarComponent.svelte';
	import TitleWithBackgroundImageComponent from '$lib/components/TitleWithBackgroundImageComponent.svelte';
	import TtsComponent from '$lib/components/TtsComponent.svelte';
	import WebPushSubscription from '$lib/components/WebPushSubscription.svelte';

	let tts: TtsComponent;

	onMount(() => {
		// after 10 seconds, cache assets
		setTimeout(() => {
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.ready.then((registration) => {
					registration.active.postMessage({ type: 'CACHE_STATIC_ASSETS' });
				});
			}
		}, 10000);
	});
</script>

<svelte:head>
	<title>LanGam CYOA - language learning "choose you own adventure" game</title>
	<meta name="description" content="Learn languages like play." />
	<link rel="preconnect" href={config.backend} />
</svelte:head>

<TitleWithBackgroundImageComponent>LanGam CYOA Game</TitleWithBackgroundImageComponent>
<GameComponent {tts}></GameComponent>
<NavbarComponent>
	<button on:click={() => goto('/catalog')}>Texts</button>
	<TtsComponent bind:this={tts} />
	<Install />
	<FeedbackComponent />
	{#if $username}
		<button on:click={() => goto('/lists')}>My vocab</button>
		<!--<WebPushSubscription />-->
	{:else}
		<button on:click={() => goto('/signup')}><b>Sign up 👤</b></button>
	{/if}
</NavbarComponent>
