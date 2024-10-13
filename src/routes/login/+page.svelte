<script lang="ts" defer>
    import '../global.css';
    import LoginComponent from '$lib/components/LoginComponent.svelte';
	import config from '../../config';
</script>

<svelte:head>
    <title>Login - LanGam CYOA - language learning "choose you own adventure" game</title>
    <meta name="description" content='Login to LanGam CYOA - language learning "choose you own adventure" game.'>
    <link rel="preconnect" href={config.backend}>
    <link rel="preconnect" href={config.pocketbase}>
</svelte:head>

<LoginComponent isSignup={false} />
