<script lang="ts" defer>
    import '../global.css';
    import LoginComponent from '$lib/components/LoginComponent.svelte';
</script>

<svelte:head>
    <title>Signup - LanGam CYOA - language learning "choose you own adventure" game</title>
    <meta name="description" content='Create an account at LanGam CYOA - language learning "choose you own adventure" game.'>
    <!-- we cannot preconnect here cause the browser throws away any preconnection after 10 seconds
    <link rel="preconnect" href={PUBLIC_POCKETBASE_URL}>-->
</svelte:head>

<LoginComponent isSignup={true} />
