<script lang="ts" defer>
	import '../global.css';
	import config from '../../config';
	import { username, targetLang } from '$lib/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import FeedbackComponent from '$lib/components/FeedbackComponent.svelte';
	import GameComponent from '$lib/components/GameComponent.svelte';
	import Install from '$lib/components/Install.svelte';
	import NavbarComponent from '$lib/components/NavbarComponent.svelte';
	import TitleWithBackgroundImageComponent from '$lib/components/TitleWithBackgroundImageComponent.svelte';
	import TtsComponent from '$lib/components/TtsComponent.svelte';
	import BadgeComponent from '$lib/components/BadgeComponent.svelte';
	import { getDue } from '$lib/components/backend';

	let tts: TtsComponent;
	let dueWords: any[];

	onMount(() => {
		// after 1 second, check for SR words
		setTimeout(async () => {
			dueWords = await getDue($targetLang.id)
			setInterval(async () => {
				dueWords = await getDue($targetLang.id)				
			}, 300000); // refresh every 5 minutes
		}, 1000);
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
	<link rel="preconnect" href={config.pocketbase} />
</svelte:head>

<TitleWithBackgroundImageComponent>LanGam CYOA Game</TitleWithBackgroundImageComponent>
<GameComponent></GameComponent>
<NavbarComponent>
	<!--<button on:click={() => goto('/catalog')}>Texts</button>-->
	<button on:click={() => goto('/options')}>Options</button>
	<Install />
	<FeedbackComponent />
	{#if $username}
		<button on:click={() => goto('/lists')}>
			Review vocab
			{#if dueWords?.length}
				<BadgeComponent text={dueWords.length} backgroundColor="darkblue"/>
			{/if}
		</button>
		<!--<WebPushSubscription />-->
	{:else}
		<button on:click={() => goto('/signup')}><b>Sign up 👤</b></button>
	{/if}
</NavbarComponent>
