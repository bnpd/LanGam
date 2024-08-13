<script lang="ts">
    import '../global.css';
    import LoginComponent from '$lib/components/LoginComponent.svelte';
	import config from '../../config';
</script>

<svelte:head>
    <title>Login - Automated Language Learning AI</title>
    <meta name="description" content="Login to AllAi - learn languages the fun way: talk about texts with AI.">
    <link rel="preconnect" href={config.backend}>
    <link rel="preconnect" href={config.pocketbase}>
</svelte:head>

<LoginComponent isSignup={false} />
