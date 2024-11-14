<script lang="ts" defer>
	import '../global.css';
	import { username } from '$lib/stores';
	import { goto } from '$app/navigation';
	import FeedbackComponent from '$lib/components/FeedbackComponent.svelte';
	import Install from '$lib/components/Install.svelte';
	import NavbarComponent from '$lib/components/NavbarComponent.svelte';
	import TitleWithBackgroundImageComponent from '$lib/components/TitleWithBackgroundImageComponent.svelte';
	import WebPushSubscription from '$lib/components/WebPushSubscription.svelte';
	import { onMount } from 'svelte';
	import ReadNChatComponent from '$lib/components/ReadNChatComponent.svelte';


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
</svelte:head>

<TitleWithBackgroundImageComponent>LanGam CYOA - language learning "choose you own adventure" game</TitleWithBackgroundImageComponent>
<ReadNChatComponent></ReadNChatComponent>
<NavbarComponent>
	<button on:click={() => goto('/catalog')}>Texts</button>
	<Install />
	<FeedbackComponent />
	{#if $username}
		<button on:click={() => goto('/lists')}>My vocab</button>
		<WebPushSubscription />
	{:else}
		<button on:click={() => goto('/signup')}><b>Sign up 👤</b></button>
	{/if}
</NavbarComponent>
