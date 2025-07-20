<script lang="ts" defer>
    import '../global.css';
    import LoginComponent from '$lib/components/LoginComponent.svelte';
	import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
</script>

<svelte:head>
    <title>Login - LanGam CYOA - language learning "choose you own adventure" game</title>
    <meta name="description" content='Login to LanGam CYOA - language learning "choose you own adventure" game.'>
    <link rel="preconnect" href={PUBLIC_POCKETBASE_URL}>
</svelte:head>

<LoginComponent isSignup={false} />
