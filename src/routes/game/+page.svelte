<script lang="ts" defer>
	import '../global.css';
	import { username } from '$lib/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import GameComponent from '$lib/components/GameComponent.svelte';
	import Install from '$lib/components/Install.svelte';
	import NavbarComponent from '$lib/components/NavbarComponent.svelte';
	import TitleWithBackgroundImageComponent from '$lib/components/TitleWithBackgroundImageComponent.svelte';
	import BadgeComponent from '$lib/components/BadgeComponent.svelte';
	import { getDue } from '$lib/components/backend';
	import HelpPopup from '$lib/components/HelpPopup.svelte';
	import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
    import { page } from '$app/stores';

	let dueWords: any[];

	onMount(() => {
		// after 1 second, check for SR words
		setTimeout(async () => {
			if ($username) {
				dueWords = await getDue($page.data?.targetLang.id)
				setInterval(async () => {
					dueWords = await getDue($page.data?.targetLang.id)				
				}, 300000); // refresh every 5 minutes
			}
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
	<link rel="preconnect" href={PUBLIC_POCKETBASE_URL} />

	<!-- Proper representation of site name in google search results -->
	<script type="application/ld+json">
	   {
	   "@context" : "https://schema.org",
	   "@type" : "WebSite",
	   "name" : "LanGam",
	   "url" : "https://langam.app/"
	   }
	</script>
</svelte:head>

<TitleWithBackgroundImageComponent>LanGam CYOA Game</TitleWithBackgroundImageComponent>
<GameComponent></GameComponent>
<NavbarComponent>
	{#if $username}
	<!--<button on:click={() => goto('/catalog')}>Texts</button>-->
	<button on:click={() => goto('/options')}>Options</button>
	{:else}
		<HelpPopup/>
	{/if}
	<Install />
	<!--<FeedbackComponent />-->
	{#if $username}
		<button on:click={() => goto('/lists')}>
			Review vocab
			{#if dueWords?.length}
				<BadgeComponent text={dueWords.length} backgroundColor="darkblue"/>
			{/if}
		</button>
		<!--<WebPushSubscription />-->
	{:else}
		<button on:click={() => goto('/signup')}><b>Register 👤</b></button>
	{/if}
</NavbarComponent>
