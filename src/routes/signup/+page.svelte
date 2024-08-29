<script lang="ts" defer>
    import '../global.css';
    import LoginComponent from '$lib/components/LoginComponent.svelte';
	import config from '../../config';
</script>

<svelte:head>
    <title>Signup - Automated Language Learning AI</title>
    <meta name="description" content="Create an account at AllAi - learn languages the fun way: talk about texts with AI.">
    <!-- we cannot preconnect here cause the browser throws away any preconnection after 10 seconds
    <link rel="preconnect" href={config.backend}>
    <link rel="preconnect" href={config.pocketbase}>-->
</svelte:head>

<LoginComponent isSignup={true} />
