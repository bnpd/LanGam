<script>
  import App from '$lib/components/App.svelte';
  import './global.css';
	import config from '../config';
</script>

<svelte:head>
	<title>Automated Language Learning AI</title>
  <meta name="description" content="Learn languages the fun way: talk about texts with AI.">
  <link rel="preconnect" href={config.backend}>
</svelte:head>

<App />
