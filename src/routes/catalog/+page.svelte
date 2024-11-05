<script>
	import CatalogComponent from '$lib/components/CatalogComponent.svelte';
  import '../global.css';
  import config from '../../config.js';
</script>

<svelte:head>
	<title>Catalog - LanGam CYOA - language learning "choose you own adventure" game</title>
  <meta name="description" content='Catalog of all our texts - LanGam CYOA - language learning "choose you own adventure" game.'>
  <link rel="preconnect" href={config.backend}>
</svelte:head>

<CatalogComponent />
